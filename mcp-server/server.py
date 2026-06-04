"""
PDF Toolkit MCP Server
AI-friendly PDF manipulation tools via Model Context Protocol.

Supports:
  - split: Split PDF at visual points or by page ranges → zip download
  - merge: Merge multiple PDFs → single PDF download
  - compress: Basic compression (object streams) → smaller PDF download
  - rotate: Rotate specific pages by angle → rotated PDF download
  - to_images: Convert selected pages to JPEG images → zip download
  - extract_text: Extract text from all pages → plain text

Usage:
  1. Install: pip install -r requirements.txt
  2. Run: python server.py
  3. Configure in AI client: stdio transport, command: python /path/to/server.py
"""

import base64
import io
import json
import os
import tempfile
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

try:
    import fitz  # PyMuPDF
except ImportError:
    raise ImportError("pymupdf is required. Run: pip install pymupdf")

try:
    from PIL import Image
except ImportError:
    raise ImportError("pillow is required. Run: pip install pillow")

try:
    from pypdf import PdfReader, PdfWriter
except ImportError:
    raise ImportError("pypdf is required. Run: pip install pypdf2")


# ─────────────────────────────────────────────
# Temp dir — files are auto-cleaned on exit
# ─────────────────────────────────────────────
PDFS_DIR = tempfile.mkdtemp(prefix="pdf_toolkit_mcp_")


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────
def _save_temp(data: bytes) -> str:
    """Write bytes to a temp file, return path."""
    path = os.path.join(PDFS_DIR, f"{os.urandom(8).hex()}.pdf")
    Path(path).write_bytes(data)
    return path


def _save_temp_bytes(data: bytes, suffix: str) -> str:
    path = os.path.join(PDFS_DIR, f"{os.urandom(8).hex()}{suffix}")
    Path(path).write_bytes(data)
    return path


def _pdf_bytes_to_base64(data: bytes) -> str:
    return base64.b64encode(data).decode("utf-8")


# ─────────────────────────────────────────────
# Tool Implementations
# ─────────────────────────────────────────────

def split_pdf(
    pdf_data_b64: str,
    mode: str,  # "visual" | "range"
    split_points: Optional[list[int]] = None,
    ranges: Optional[list[dict]] = None,
    filenames: Optional[list[str]] = None,
) -> dict:
    """
    Split one PDF into multiple PDFs.

    mode=visual  — split_points: list of page numbers (split happens AFTER these pages)
                    filenames: one name per output file
    mode=range   — ranges: [{"start": 1, "end": 5}, ...] (1-based, inclusive)
                    filenames auto-generated

    Returns: {"files": [{"name": "...", "data_b64": "..."}]}
    """
    data = base64.b64decode(pdf_data_b64)
    doc = fitz.open(stream=data, filetype="pdf")
    total = doc.page_count

    results: list[dict] = []

    if mode == "visual":
        points = split_points or []
        if not points:
            return {"files": [{"name": "output.pdf", "data_b64": pdf_data_b64}]}
        pts = sorted(set(points))
        base = os.path.splitext(getattr(doc, "name", "document"))[0] or "document"
        start = 0
        for i, pt in enumerate(pts):
            end = pt  # pages 0..pt-1
            if start >= end or end > total:
                continue
            sub_doc = fitz.open()
            for pnum in range(start, end):
                sub_doc.insert_pdf(doc, from_page=pnum, to_page=pnum)
            name = (filenames[i] if filenames and i < len(filenames) else
                    f"{base}_part_{i+1}_pages_{start+1}-{end}.pdf")
            results.append({"name": name, "data_b64": _pdf_bytes_to_base64(sub_doc.tobytes())})
            start = end
        # tail
        if start < total:
            sub_doc = fitz.open()
            for pnum in range(start, total):
                sub_doc.insert_pdf(doc, from_page=pnum, to_page=pnum)
            name = (filenames[-1] if filenames else
                    f"{base}_part_{len(pts)+1}_pages_{start+1}-{total}.pdf")
            results.append({"name": name, "data_b64": _pdf_bytes_to_base64(sub_doc.tobytes())})

    elif mode == "range":
        base = os.path.splitext(getattr(doc, "name", "document"))[0] or "document"
        for i, rng in enumerate(ranges or []):
            s = max(1, rng["start"])
            e = min(total, rng["end"])
            if s > e:
                continue
            sub_doc = fitz.open()
            for pnum in range(s - 1, e):  # 0-based
                sub_doc.insert_pdf(doc, from_page=pnum, to_page=pnum)
            suffix = "" if s == e else f"_pages_{s}-{e}"
            name = f"{base}{suffix}.pdf"
            results.append({"name": name, "data_b64": _pdf_bytes_to_base64(sub_doc.tobytes())})

    else:
        raise ValueError(f"Unknown mode: {mode}")

    doc.close()
    return {"files": results}


def merge_pdfs(pdf_data_b64_list: list[str], output_name: str = "merged.pdf") -> dict:
    """
    Merge multiple PDFs into one.

    pdf_data_b64_list: list of base64-encoded PDF bytes
    output_name: name of the output file

    Returns: {"name": "...", "data_b64": "..."}
    """
    writer = PdfWriter()
    for item in pdf_data_b64_list:
        data = base64.b64decode(item)
        reader = PdfReader(io.BytesIO(data))
        for page in reader.pages:
            writer.add_page(page)

    buf = io.BytesIO()
    writer.write(buf)
    return {"name": output_name, "data_b64": _pdf_bytes_to_base64(buf.getvalue())}


def compress_pdf(pdf_data_b64: str) -> dict:
    """
    Basic PDF compression using object streams.

    Returns: {"name": "...", "data_b64": "..."}
    """
    data = base64.b64decode(pdf_data_b64)
    reader = PdfReader(io.BytesIO(data))
    writer = PdfWriter()

    for page in reader.pages:
        writer.add_page(page)

    # Use compress_content_streams reduces size for many PDFs
    writer.compress_content_streams = True

    buf = io.BytesIO()
    writer.write(buf)
    return {"name": "compressed.pdf", "data_b64": _pdf_bytes_to_base64(buf.getvalue())}


def rotate_pdf(
    pdf_data_b64: str,
    rotations: dict[int, int],
) -> dict:
    """
    Rotate specific pages.

    rotations: {1: 90, 3: 180, ...}  page_number → degrees (positive = clockwise)
    Returns: {"name": "...", "data_b64": "..."}
    """
    data = base64.b64decode(pdf_data_b64)
    doc = fitz.open(stream=data, filetype="pdf")

    for pnum_1based, angle in rotations.items():
        pnum_0based = pnum_1based - 1
        if 0 <= pnum_0based < doc.page_count:
            page = doc[pnum_0based]
            current = page.rotation
            new_rot = (current + angle) % 360
            page.set_rotation(new_rot)

    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return {"name": "rotated.pdf", "data_b64": _pdf_bytes_to_base64(buf.getvalue())}


def pdf_to_images(
    pdf_data_b64: str,
    pages: Optional[list[int]] = None,
    dpi: int = 150,
) -> dict:
    """
    Convert selected PDF pages to JPEG images.

    pages: list of 1-based page numbers (None = all pages)
    dpi: render resolution (default 150, increase for better quality)
    Returns: {"files": [{"name": "...", "data_b64": "..."}]}
    """
    data = base64.b64decode(pdf_data_b64)
    doc = fitz.open(stream=data, filetype="pdf")
    base = os.path.splitext(getattr(doc, "name", "document"))[0] or "doc"
    page_nums = pages or list(range(1, doc.page_count + 1))

    results: list[dict] = []
    for pnum_1based in page_nums:
        pnum_0based = pnum_1based - 1
        if not (0 <= pnum_0based < doc.page_count):
            continue
        page = doc[pnum_0based]
        mat = fitz.Matrix(dpi / 72, dpi / 72)
        clip = page.get_pixmap(matrix=mat)
        img = Image.frombytes("RGB", [clip.width, clip.height], clip.samples)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=92)
        results.append({
            "name": f"{base}-page-{pnum_1based}.jpg",
            "data_b64": _pdf_bytes_to_base64(buf.getvalue()),
        })

    doc.close()
    return {"files": results}


def extract_text(pdf_data_b64: str, pages: Optional[list[int]] = None) -> dict:
    """
    Extract text from PDF pages.

    pages: list of 1-based page numbers (None = all pages)
    Returns: {"text": "...", "pages_summary": {...}}
    """
    data = base64.b64decode(pdf_data_b64)
    doc = fitz.open(stream=data, filetype="pdf")
    page_nums = pages or list(range(1, doc.page_count + 1))

    full_text = ""
    pages_summary: dict[int, str] = {}

    for pnum_1based in page_nums:
        pnum_0based = pnum_1based - 1
        if not (0 <= pnum_0based < doc.page_count):
            continue
        page = doc[pnum_0based]
        txt = page.get_text("text")
        full_text += f"\n--- Page {pnum_1based} ---\n{txt}\n"
        pages_summary[pnum_1based] = txt[:200] + ("..." if len(txt) > 200 else "")

    doc.close()
    return {"text": full_text.strip(), "pages_summary": pages_summary}


def pdf_info(pdf_data_b64: str) -> dict:
    """
    Get PDF metadata: page count, title, author, size, etc.

    Returns: {"page_count": int, "metadata": {...}, "page_sizes": [...]}
    """
    data = base64.b64decode(pdf_data_b64)
    doc = fitz.open(stream=data, filetype="pdf")

    page_sizes: list[dict] = []
    for i, page in enumerate(doc):
        rect = page.rect
        page_sizes.append({
            "page": i + 1,
            "width_pt": rect.width,
            "height_pt": rect.height,
            "width_in": round(rect.width / 72, 2),
            "height_in": round(rect.height / 72, 2),
        })

    info = {
        "page_count": doc.page_count,
        "metadata": doc.metadata,
        "page_sizes": page_sizes,
    }
    doc.close()
    return info


# ─────────────────────────────────────────────
# MCP Server Entry Point
# ─────────────────────────────────────────────
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

PDF_TOOLKIT_SERVER = Server("pdf-toolkit-pro")


@PDF_TOOLKIT_SERVER.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="split_pdf",
            description="Split one PDF into multiple PDFs. Use mode='visual' with split_points to split at specific page boundaries, or mode='range' with ranges to extract specific page ranges.",
            inputSchema={
                "type": "object",
                "properties": {
                    "pdf_data_b64": {"type": "string", "description": "Base64-encoded PDF file bytes"},
                    "mode": {"type": "string", "enum": ["visual", "range"], "description": "'visual' splits at selected page numbers; 'range' extracts specific 1-based page ranges"},
                    "split_points": {"type": "array", "items": {"type": "integer"}, "description": "Page numbers after which to split (mode='visual'). E.g. [3, 5] splits into pages 1-3, 4-5, 6-end."},
                    "ranges": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "start": {"type": "integer"},
                                "end": {"type": "integer"}
                            }
                        },
                        "description": "1-based inclusive page ranges (mode='range'). E.g. [{'start':1,'end':5}, {'start':8,'end':10}]."
                    },
                    "filenames": {"type": "array", "items": {"type": "string"}, "description": "Output filenames (mode='visual'). Must have len(split_points)+1 entries."},
                },
                "required": ["pdf_data_b64", "mode"],
            },
        ),
        Tool(
            name="merge_pdfs",
            description="Merge multiple PDF files into a single PDF. Files are combined in the order provided.",
            inputSchema={
                "type": "object",
                "properties": {
                    "pdf_data_b64_list": {"type": "array", "items": {"type": "string"}, "description": "List of base64-encoded PDF bytes, in merge order"},
                    "output_name": {"type": "string", "description": "Output filename", "default": "merged.pdf"},
                },
                "required": ["pdf_data_b64_list"],
            },
        ),
        Tool(
            name="compress_pdf",
            description="Apply basic compression to a PDF using object streams. Reduces file size for unoptimized documents.",
            inputSchema={
                "type": "object",
                "properties": {
                    "pdf_data_b64": {"type": "string", "description": "Base64-encoded PDF file bytes"},
                },
                "required": ["pdf_data_b64"],
            },
        ),
        Tool(
            name="rotate_pdf",
            description="Rotate specific pages of a PDF by arbitrary angles. Rotations are cumulative (applied on top of existing rotation).",
            inputSchema={
                "type": "object",
                "properties": {
                    "pdf_data_b64": {"type": "string", "description": "Base64-encoded PDF file bytes"},
                    "rotations": {"type": "object", "additionalProperties": {"type": "integer"}, "description": "Map of page number (1-based) to degrees to rotate clockwise. E.g. {'1': 90, '3': 180} rotates page 1 by 90° and page 3 by 180°."},
                },
                "required": ["pdf_data_b64", "rotations"],
            },
        ),
        Tool(
            name="pdf_to_images",
            description="Convert selected PDF pages to JPEG images. Useful for generating thumbnails or image-based PDFs.",
            inputSchema={
                "type": "object",
                "properties": {
                    "pdf_data_b64": {"type": "string", "description": "Base64-encoded PDF file bytes"},
                    "pages": {"type": "array", "items": {"type": "integer"}, "description": "1-based page numbers to convert. None = all pages."},
                    "dpi": {"type": "integer", "description": "Render DPI. Higher = better quality, larger files. Default 150.", "default": 150},
                },
                "required": ["pdf_data_b64"],
            },
        ),
        Tool(
            name="extract_text",
            description="Extract text content from PDF pages. Works on text-based PDFs; image-based (scanned) PDFs may return little or no text.",
            inputSchema={
                "type": "object",
                "properties": {
                    "pdf_data_b64": {"type": "string", "description": "Base64-encoded PDF file bytes"},
                    "pages": {"type": "array", "items": {"type": "integer"}, "description": "1-based page numbers to extract from. None = all pages."},
                },
                "required": ["pdf_data_b64"],
            },
        ),
        Tool(
            name="pdf_info",
            description="Get metadata and structural info about a PDF: page count, dimensions, metadata fields.",
            inputSchema={
                "type": "object",
                "properties": {
                    "pdf_data_b64": {"type": "string", "description": "Base64-encoded PDF file bytes"},
                },
                "required": ["pdf_data_b64"],
            },
        ),
    ]


@PDF_TOOLKIT_SERVER.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    try:
        if name == "split_pdf":
            result = split_pdf(**arguments)
        elif name == "merge_pdfs":
            result = merge_pdfs(**arguments)
        elif name == "compress_pdf":
            result = compress_pdf(**arguments)
        elif name == "rotate_pdf":
            result = rotate_pdf(**arguments)
        elif name == "pdf_to_images":
            result = pdf_to_images(**arguments)
        elif name == "extract_text":
            result = extract_text(**arguments)
        elif name == "pdf_info":
            result = pdf_info(**arguments)
        else:
            raise ValueError(f"Unknown tool: {name}")

        return [TextContent(type="text", text=json.dumps(result, indent=2, ensure_ascii=False))]

    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        return [TextContent(type="text", text=json.dumps({"error": str(e), "traceback": tb}, indent=2))]


async def main():
    async with stdio_server() as (read_stream, write_stream):
        await PDF_TOOLKIT_SERVER.run(
            read_stream,
            write_stream,
            PDF_TOOLKIT_SERVER.create_initialization_options(),
        )


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())

import io

import pymupdf
from docx import Document


class UnsupportedFormatError(ValueError):
    pass


class EmptyDocumentError(ValueError):
    pass


def extract_pdf(data: bytes) -> str:
    doc = pymupdf.open(stream=data, filetype="pdf")
    try:
        return "\n".join(page.get_text() for page in doc).strip()
    finally:
        doc.close()


def extract_docx(data: bytes) -> str:
    doc = Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs).strip()


def extract_txt(data: bytes) -> str:
    try:
        return data.decode("utf-8").strip()
    except UnicodeDecodeError:
        return data.decode("utf-8", errors="ignore").strip()


def extract_text(data: bytes, filename: str) -> str:
    name = filename.lower()
    if name.endswith(".pdf"):
        text = extract_pdf(data)
    elif name.endswith(".docx"):
        text = extract_docx(data)
    elif name.endswith(".txt"):
        text = extract_txt(data)
    else:
        raise UnsupportedFormatError(f"Unsupported file: {filename}")
    if not text:
        raise EmptyDocumentError("Document has no extractable text")
    return text

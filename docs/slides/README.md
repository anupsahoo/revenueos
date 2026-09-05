# Slides

Ten slides. Both artefacts are generated from scripts in this folder, so the deck
can be rebuilt rather than hand-patched.

| File | Built by | Notes |
|---|---|---|
| `RevenueOS.pptx` | `build_deck.py` (python-pptx) | The editable version. Open in Keynote or PowerPoint. |
| `RevenueOS.pdf` | `build_pdf.sh` → `deck.html` (headless Chrome) | The one to send. |

Same ten slides and the same palette as the operator screen, but two different
renderers, so the two files are not pixel-identical. If you change a slide,
change it in both `build_deck.py` and `deck.html`.

```sh
python3 -m venv .venv && .venv/bin/pip install python-pptx
.venv/bin/python docs/slides/build_deck.py   # → RevenueOS.pptx
docs/slides/build_pdf.sh                     # → RevenueOS.pdf
```

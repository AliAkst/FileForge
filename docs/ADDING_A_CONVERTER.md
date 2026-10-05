# How to Add a New Converter

Follow these steps to implement a new file conversion capability in FileForge.

## 1. Create the Converter File
Create a new Python file in `backend/app/infrastructure/converters/`. Use a descriptive name, e.g., `csv_to_xlsx_converter.py`.

## 2. Implement the `Converter` Port
Your class must implement the `Converter` protocol defined in `backend/app/domain/ports/converter.py`.

```python
from backend.app.domain.ports.converter import Converter, ConversionResult
from backend.app.infrastructure.converters.registry import register_converter

@register_converter
class MyNewConverter(Converter):
    id = "my-new-converter-id"
    supported_source_formats = ["csv"]
    target_format = "xlsx"
    options_schema = {
        "type": "object",
        "properties": {
            "delimiter": {"type": "string", "default": ","}
        }
    }

    async def convert(self, input_path: Path, output_dir: Path, options: dict) -> ConversionResult:
        # Your implementation logic here
        ...
```

## 3. Register the Converter
The `@register_converter` decorator handles registration. Ensure the module is imported during application startup (the registry's auto-discovery mechanism will handle the rest if the directory is scanned).

## 4. Add Unit Tests
Create a corresponding test file in `backend/tests/unit/infrastructure/converters/test_my_new_converter.py`.

Tests should cover:
- Successful conversion with default options.
- Successful conversion with custom options.
- Error handling for invalid input files.
- Error handling for unsupported source formats.

## 5. Update Documentation
- Add an entry to `docs/LICENSES.md` if your converter introduces new third-party dependencies.
- If the conversion is a major new capability, add a note in `docs/PROGRESS.md` once completed.

import base64
from pathlib import Path
import subprocess
import sys


def create_file_content():
    file_content_path = Path(__file__).resolve().parent / "file_content.py"
    with file_content_path.open("w") as output:
        output.write("import base64\n")
        src_dir = Path(__file__).resolve().parents[1] / "native_messaging"

        with (src_dir / "open_tortoise_svn.json").open("rb") as file:
            data = base64.b64encode(file.read()).decode("ascii")
        output.write(f"json = base64.b64decode(b'{data}')\n")

        with (src_dir / "open_tortoise_svn_host.exe").open("rb") as file:
            data = base64.b64encode(file.read()).decode("ascii")
        output.write(f"exe = base64.b64decode(b'{data}')\n")


def create_exe():
    cwd = Path(__file__).resolve().parent
    pythonw_exe = str(Path(sys.executable).parent / "python.exe")
    command = [
        pythonw_exe, "-m", "exepy", "create", "-f", "copy_tsvn_tool.exe",
        "install.py", "file_content.py", "main.py"
    ]
    subprocess.check_output(command, cwd=cwd)
    command = [
        pythonw_exe, "-m", "exepy", "create", "-f", "remove_tsvn_tool.exe",
        "uninstall.py", "file_content.py", "main.py"
    ]
    subprocess.check_output(command, cwd=cwd)


if __name__ == "__main__":
    create_file_content()
    create_exe()

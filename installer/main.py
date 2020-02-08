import file_content
import os
from pathlib import Path
import shutil
import tkinter
import tkinter.messagebox
import winreg

TARGET_DIR = (Path(os.environ["LOCALAPPDATA"]) /
              "masamitsu.murase.open_tortoise_svn")
KEY_ROOT = winreg.HKEY_CURRENT_USER
KEY_BASE = r"Software\Google\Chrome\NativeMessagingHosts"

OPEN_TSVN_KEY = KEY_BASE + "\\" + "masamitsu.murase.open_tortoise_svn"
JSON_FILENAME = "open_tortoise_svn.json"
FILE_CONTENTS = {
    "open_tortoise_svn.json": file_content.json,
    "open_tortoise_svn_host.exe": file_content.exe
}

POPUP_TITLE = "Open TortoiseSVN"

root = tkinter.Tk()
root.withdraw()


def set_reg_key():
    value = str(TARGET_DIR / JSON_FILENAME)
    with winreg.CreateKeyEx(KEY_ROOT, OPEN_TSVN_KEY) as key:
        winreg.SetValueEx(key, "", 0, winreg.REG_SZ, value)


def get_reg_key():
    with winreg.OpenKeyEx(KEY_ROOT, OPEN_TSVN_KEY) as key:
        return winreg.QueryValueEx(key, "")[0]


def check_reg_key():
    return get_reg_key() == str(TARGET_DIR / JSON_FILENAME)


def delete_reg_key():
    winreg.DeleteKeyEx(KEY_ROOT, OPEN_TSVN_KEY)


def install_files():
    TARGET_DIR.mkdir(parents=True, exist_ok=True)

    for filename, content in FILE_CONTENTS.items():
        with (TARGET_DIR / filename).open("wb") as file:
            file.write(content)


def uninstall_files():
    if TARGET_DIR.exists():
        shutil.rmtree(TARGET_DIR)


def check_files():
    if not TARGET_DIR.is_dir():
        return False
    if not all((TARGET_DIR / item).is_file() for item in FILE_CONTENTS.keys()):
        return False

    for filename, content in FILE_CONTENTS.items():
        with (TARGET_DIR / filename).open("rb") as file:
            if file.read() != content:
                return False

    return True


def install_all():
    set_reg_key()
    install_files()


def check_installed():
    return check_reg_key() and check_files()


def uninstall_all():
    try:
        delete_reg_key()
    except OSError:
        pass
    try:
        uninstall_files()
    except OSError:
        pass


def check_uninstalled():
    try:
        get_reg_key()
    except OSError:
        pass
    else:
        return False

    return not TARGET_DIR.exists()


def show_install_message(success):
    if success:
        msg = ("Installation was completed successfully.\n\n" +
               "Files are installed in '" + str(TARGET_DIR) + "'.")
        tkinter.messagebox.showinfo(POPUP_TITLE, msg)
    else:
        msg = "Installation failed."
        tkinter.messagebox.showwarning(POPUP_TITLE, msg)


def show_uninstall_message(success):
    if success:
        msg = "Uninstallation was completed successfully."
        tkinter.messagebox.showinfo(POPUP_TITLE, msg)
    else:
        msg = "Uninstallation failed."
        tkinter.messagebox.showwarning(POPUP_TITLE, msg)

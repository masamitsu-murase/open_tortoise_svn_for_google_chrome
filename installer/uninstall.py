import main
import sys
import tkinter.messagebox

POPUP_TITLE = "Uninstaller - Open TortoiseSVN"


def usage():
    msg = "Run uninstall.exe to uninstall open_tortoise_svn_host.exe."
    tkinter.messagebox.showinfo(POPUP_TITLE, msg)


def check_really_uninstall():
    msg = "Click 'OK' to uninstall open_tortoise_svn_host.exe or 'Cancel' to exit the uninstaller."
    return tkinter.messagebox.askokcancel(POPUP_TITLE, msg)


if len(sys.argv) != 1:
    usage()
    sys.exit(0)

if not check_really_uninstall():
    sys.exit(0)

try:
    main.uninstall_all()
    main.show_uninstall_message(main.check_uninstalled())
except Exception:
    main.show_uninstall_message(False)

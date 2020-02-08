import main
import sys
import tkinter.messagebox

POPUP_TITLE = "Installer - Open TortoiseSVN"


def usage():
    msg = "Run install.exe to install open_tortoise_svn_host.exe."
    tkinter.messagebox.showinfo(POPUP_TITLE, msg)


def check_really_install():
    msg = "Click 'OK' to install open_tortoise_svn_host.exe or 'Cancel' to exit the installer."
    return tkinter.messagebox.askokcancel(POPUP_TITLE, msg)


if len(sys.argv) != 1:
    usage()
    sys.exit(0)

if not check_really_install():
    sys.exit(0)

try:
    main.install_all()
    main.show_install_message(main.check_installed())
except Exception:
    main.show_install_message(False)

import importlib.util
import tkinter as tk
from pathlib import Path

BASE = Path(__file__).resolve().parent


def load_module(name, file_name):
    file_path = BASE / file_name
    spec = importlib.util.spec_from_file_location(name, file_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Tidak dapat memuat modul {file_name}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


admin_module = load_module("admin_app", "admin_app.py")
ustadzah_module = load_module("ustadzah_app", "ustadzah_app.py")
ortu_module = load_module("orang_tua_app", "orang tua_app.py")

AdminApp = admin_module.AdminApp
UstadzahApp = ustadzah_module.UstadzahApp
OrangTuaApp = ortu_module.OrangTuaApp


class GabungkanSIPENA:
    def __init__(self, root):
        self.root = root
        self.root.title("SIPENA — Pilih Role")
        self.root.geometry("760x520")
        self.root.configure(bg="#F0F7FF")
        self.tampilkan_pilihan()

    def bersihkan_halaman(self):
        for widget in self.root.winfo_children():
            widget.destroy()

    def tampilkan_pilihan(self):
        self.bersihkan_halaman()
        self.root.config(menu="")

        frame = tk.Frame(self.root, bg="#F0F7FF")
        frame.place(relx=0.5, rely=0.5, anchor="center")

        tk.Label(
            frame,
            text="SIPENA",
            font=("Comic Sans MS", 32, "bold"),
            fg="#4A90E2",
            bg="#F0F7FF",
        ).pack(pady=(0, 6))

        tk.Label(
            frame,
            text="Gabungkan akses Admin, Ustadzah, dan Orang Tua",
            font=("Segoe UI", 12),
            fg="#2C3E50",
            bg="#F0F7FF",
        ).pack(pady=(0, 24))

        btn_frame = tk.Frame(frame, bg="#F0F7FF")
        btn_frame.pack()

        buttons = [
            ("🔐 Admin", AdminApp, "#6BB8E8"),
            ("👩‍🏫 Ustadzah", UstadzahApp, "#4A90E2"),
            ("👨‍👩‍👧 Orang Tua", OrangTuaApp, "#27AE60"),
        ]

        for label, app_cls, color in buttons:
            tk.Button(
                btn_frame,
                text=label,
                font=("Segoe UI", 12, "bold"),
                bg=color,
                fg="white",
                relief="flat",
                padx=28,
                pady=14,
                width=22,
                command=lambda cls=app_cls: self.buka_role(cls),
            ).pack(pady=10)

    def buka_role(self, app_cls):
        self.root.config(menu="")
        app_cls(self.root)


if __name__ == "__main__":
    root = tk.Tk()
    GabungkanSIPENA(root)
    root.mainloop()

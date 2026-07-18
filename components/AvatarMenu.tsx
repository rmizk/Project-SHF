"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, LogOut, UserRound } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { useOrganization } from "./OrganizationProvider";
import OrgAvatar from "./OrgAvatar";

// Menu de l'avatar de la TopBar : « Profil » + « Se déconnecter ».
// Rendu via portal en position fixe, comme RowActionsMenu.

const MENU_WIDTH = 200;
const MENU_HEIGHT = 2 * 44 + 10;

type Position = { top: number; left: number };

export default function AvatarMenu() {
  const organization = useOrganization();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [isSigningOut, startSignOut] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({
      top: rect.bottom + 6,
      left: Math.max(
        8,
        Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)
      ),
    });
  }, []);

  const toggle = () => {
    if (!open) place();
    setOpen((o) => !o);
  };

  // Referme le menu après une navigation (ex. clic sur « Profil »)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !triggerRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  const itemClass =
    "flex h-11 w-full items-center gap-2.5 px-4 text-left text-sm font-semibold transition-colors";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-label="Menu du compte"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-full transition-opacity hover:opacity-80"
      >
        <OrgAvatar
          organization={organization}
          className="h-9 w-9 rounded-lg text-xs"
        />
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Menu du compte"
            style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
            className="fixed z-[60] overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-xl shadow-neutral-900/10 dark:border-neutral-700 dark:bg-card-dark"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                router.push("/profil");
              }}
              className={`${itemClass} hover:bg-neutral-50 dark:hover:bg-neutral-800`}
            >
              <UserRound size={16} className="text-neutral-400" />
              Profil
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={isSigningOut}
              onClick={() => startSignOut(() => signOut())}
              className={`${itemClass} text-red-600 hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/50`}
            >
              {isSigningOut ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <LogOut size={16} />
              )}
              Se déconnecter
            </button>
          </div>,
          document.body
        )}
    </>
  );
}

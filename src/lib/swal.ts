import Swal from "sweetalert2";

// Instance SweetAlert2 avec la charte ProDigital
const ProSwal = Swal.mixin({
  customClass: {
    confirmButton:
      "bg-[#1B2A6B] hover:bg-[#162058] text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm",
    cancelButton:
      "bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm",
    popup: "rounded-2xl shadow-lg",
    title: "text-[#1B2A6B] font-extrabold text-lg",
    htmlContainer: "text-gray-500 text-sm",
  },
  buttonsStyling: false,
  reverseButtons: true,
});

// ─── Succès ───────────────────────────────────────────────────────────────────
export function swalSuccess(title: string, text?: string) {
  return ProSwal.fire({
    icon: "success",
    title,
    text,
    confirmButtonText: "OK",
    timer: text ? undefined : 2000,
    timerProgressBar: !text,
  });
}

// ─── Erreur ───────────────────────────────────────────────────────────────────
export function swalError(title: string, text?: string) {
  return ProSwal.fire({
    icon: "error",
    title,
    text: text ?? "Une erreur est survenue. Réessayez.",
    confirmButtonText: "Fermer",
  });
}

// ─── Avertissement ────────────────────────────────────────────────────────────
export function swalWarning(title: string, text?: string) {
  return ProSwal.fire({
    icon: "warning",
    title,
    text,
    confirmButtonText: "OK",
  });
}

// ─── Confirmation (oui / non) ─────────────────────────────────────────────────
export function swalConfirm(title: string, text?: string, confirmText = "Confirmer") {
  return ProSwal.fire({
    icon: "question",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Annuler",
  });
}

// ─── Confirmation suppression (rouge) ─────────────────────────────────────────
export function swalDelete(title: string, text?: string) {
  return Swal.mixin({
    customClass: {
      confirmButton:
        "bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm",
      cancelButton:
        "bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm",
      popup: "rounded-2xl shadow-lg",
      title: "text-gray-800 font-extrabold text-lg",
      htmlContainer: "text-gray-500 text-sm",
    },
    buttonsStyling: false,
    reverseButtons: true,
  }).fire({
    icon: "warning",
    title,
    text: text ?? "Cette action est irréversible.",
    showCancelButton: true,
    confirmButtonText: "Supprimer",
    cancelButtonText: "Annuler",
  });
}

// ─── Toast léger (coin haut droit) ────────────────────────────────────────────
export function swalToast(
  icon: "success" | "error" | "warning" | "info",
  title: string
) {
  return Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    customClass: {
      popup: "rounded-xl shadow-md text-sm",
    },
  }).fire({ icon, title });
}

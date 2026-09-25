import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import OfferPopup from "@/components/public/OfferPopup";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <OfferPopup />
    </div>
  );
}

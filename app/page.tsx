import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQ from "@/components/FAQ";
import AppScreenshotGenerator from "@/components/AppScreenshotGenerator";

export default function Home() {
  return (
    <div className="min-h-screen font-primary bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-display font-bold tracking-tight text-gray-900 sm:text-4xl">
            Create Store Screenshots Effortlessly
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 font-secondary">
            Generate beautiful marketing images for App Store and Google Play.
          </p>
          <p className="max-w-2xl mx-auto font-bold text-lg text-gray-600 font-secondary">
            No account required. It's fast & free.
          </p>
        </div>

        <AppScreenshotGenerator />
      </div>

      <FAQ />
      <Footer />
    </div>
  );
}

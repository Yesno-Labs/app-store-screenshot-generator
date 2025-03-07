import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="md:w-1/2">
            <p className="text-base text-gray-500 mb-4">
              The App Store Screenshot Generator helps developers and marketers
              create professional screenshots for Apple App Store and Google
              Play Store listings.
            </p>
            <p className="text-sm text-gray-400">
              © {currentYear} Created by{" "}
              <a
                href="https://www.yesnolabs.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-500 hover:text-indigo-600"
              >
                Yesno Labs
              </a>
              . All rights reserved.
            </p>
          </div>

          <div className="mt-8 md:mt-0">
            <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/bulk-upload"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  Bulk Upload
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

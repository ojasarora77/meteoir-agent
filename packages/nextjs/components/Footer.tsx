import React from "react";
import Link from "next/link";

/**
 * Site footer
 */
export const Footer = () => {

  return (
    <footer className="bg-gray-800 text-white py-10">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* About Us */}
        <div>
          <h3 className="text-xl font-bold mb-4">About Us</h3>
          <p className="text-gray-400">
            MeteoirAgent is an autonomous AI agent for cross-chain payments, enabling seamless machine-to-machine commerce.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-xl font-bold mb-4">Quick Links</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/debug" className="text-gray-400 hover:text-white transition-colors">
                Debug
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Us */}
        <div>
          <h3 className="text-xl font-bold mb-4">Contact Us</h3>
          <p className="text-gray-400">Email: info@meteoragent.com</p>
          <div className="flex space-x-4 mt-4">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <i className="fab fa-twitter"></i> {/* Placeholder for Twitter icon */}
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <i className="fab fa-linkedin"></i> {/* Placeholder for LinkedIn icon */}
            </a>
          </div>
        </div>
      </div>

      <div className="text-center text-gray-500 mt-8">
        &copy; {new Date().getFullYear()} MeteoirAgent. All rights reserved.
      </div>
    </footer>
  );
};

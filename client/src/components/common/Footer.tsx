// client/src/components/common/Footer.tsx
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="text-gray-600 text-sm mb-2 md:mb-0">
            © 2024 JandiBat Live Draft. Made with ❤️ for SOOP streamers.
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary-600 transition-colors"
            >
              GitHub
            </a>
            <a 
              href="mailto:support@jandibat.com"
              className="hover:text-primary-600 transition-colors"
            >
              문의하기
            </a>
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
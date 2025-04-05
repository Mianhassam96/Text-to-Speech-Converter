
import { Github } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full py-6 bg-indigo-900 text-white mt-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold">MultiMian TTS</h3>
            <p className="text-indigo-200 text-sm">
              Convert your text to natural-sounding speech
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <a 
              href="https://github.com/Mianhassam96" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-indigo-200 transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
            <span className="text-indigo-200 text-sm">
              © {new Date().getFullYear()} MultiMian
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

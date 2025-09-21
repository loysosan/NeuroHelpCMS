import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-[10px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 md:gap-6 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold tracking-tight">NeuroHelp</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Платформа підтримки: спеціалісти, матеріали та інструменти для ментального здоровʼя.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Навігація</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-gray-600 hover:text-gray-900">Головна</Link></li>
              <li><Link to="/search" className="text-gray-600 hover:text-gray-900">Спеціалісти</Link></li>
              <li><Link to="/articles" className="text-gray-600 hover:text-gray-900">Статті</Link></li>
              <li><Link to="/news" className="text-gray-600 hover:text-gray-900">Новини</Link></li>
              <li><Link to="/about" className="text-gray-600 hover:text-gray-900">Про нас</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Користувачу</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="text-gray-600 hover:text-gray-900">Увійти</Link></li>
              <li><Link to="/register" className="text-gray-600 hover:text-gray-900">Реєстрація</Link></li>
              <li><Link to="/profile" className="text-gray-600 hover:text-gray-900">Профіль</Link></li>
              <li><Link to="/favorites" className="text-gray-600 hover:text-gray-900">Обране</Link></li>
              <li><Link to="/help" className="text-gray-600 hover:text-gray-900">Допомога</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Контакти</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-600">support@neurohelp.example</li>
              <li className="text-gray-600">+380 (00) 000 00 00</li>
              <li><Link to="/privacy" className="text-gray-600 hover:text-gray-900">Конфіденційність</Link></li>
              <li><Link to="/terms" className="text-gray-600 hover:text-gray-900">Умови користування</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} NeuroHelp. Всі права захищені.</span>
          <span>Створено з турботою про користувачів.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
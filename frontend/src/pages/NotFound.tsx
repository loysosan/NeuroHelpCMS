import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
    <h1 className="text-4xl font-bold mb-4">404 — Сторінку не знайдено</h1>
    <Link to="/" className="text-blue-600 hover:underline">
      Повернутися на головну
    </Link>
  </div>
);

export default NotFound;
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import CreateSkillModal from '../components/CreateSkillModal';
import CreateCategoryModal from '../components/CreateCategoryModal';

type Skill = {
  ID: number;
  Name: string;
  CategoryID: number;
  CreatedAt: string;
  UpdatedAt: string;
};

type Category = {
  ID: number;
  Name: string;
  CreatedAt: string;
  UpdatedAt: string;
};

const AdminSkills: React.FC = () => {
  const { token } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  const fetchSkills = async () => {
    try {
      const res = await fetch('/api/admin/skills', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Не вдалося завантажити навички');

      const data = await res.json();
      setSkills(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/skills/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Не вдалося завантажити категорії');

      const data = await res.json();
      setCategories(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSkill = async (skillData: any) => {
    try {
      const res = await fetch('/api/admin/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(skillData)
      });

      if (!res.ok) throw new Error('Не вдалося створити навичку');

      await fetchSkills();
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateCategory = async (categoryData: { Name: string }) => {
    try {
      const res = await fetch('/api/admin/skills/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(categoryData)
      });

      if (!res.ok) throw new Error('Не вдалося створити категорію');

      await fetchCategories(); // Оновлюємо список категорій
      setIsCreateCategoryModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteClick = (skillId: number) => {
    setSkillToDelete(skillId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!skillToDelete) return;

    try {
      const res = await fetch(`/api/admin/skills/${skillToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Не вдалося видалити навичку');

      setSkills(skills.filter(skill => skill.ID !== skillToDelete));
      setIsDeleteModalOpen(false);
      setSkillToDelete(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const res = await fetch(`/api/admin/skills/categories/${categoryToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Не вдалося видалити категорію');

      setCategories(categories.filter(cat => cat.ID !== categoryToDelete));
      setIsDeleteCategoryModalOpen(false);
      setCategoryToDelete(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateSkill = async (skillId: number, skillData: any) => {
    try {
      const res = await fetch(`/api/admin/skills/${skillId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(skillData)
      });

      if (!res.ok) throw new Error('Не вдалося оновити навичку');

      await fetchSkills();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
  };

  const handleUpdateCategory = async (categoryData: { Name: string }) => {
    if (!editingCategory) return;
    
    try {
      const res = await fetch(`/api/admin/skills/categories/${editingCategory.ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(categoryData)
      });

      if (!res.ok) throw new Error('Не вдалося оновити категорію');

      await fetchCategories();
      setEditingCategory(null); // Закриваємо модальне вікно після успішного оновлення
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchSkills();
    fetchCategories();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Секція категорій */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Категорії</h2>
              <button
                onClick={() => setIsCreateCategoryModalOpen(true)}
                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                + Додати
              </button>
            </div>
            <div className="space-y-2">
              {categories.map(category => (
                <div
                  key={category.ID}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100"
                >
                  <span>{category.Name}</span>
                  <div className="space-x-2">
                    <button
                      onClick={() => setEditingCategory(category)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => {
                        setCategoryToDelete(category.ID);
                        setIsDeleteCategoryModalOpen(true);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Секція навичок */}
          <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Навички</h2>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
              >
                + Додати навичку
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Назва</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Категорія</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Дії</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {skills.map(skill => {
                    const category = categories.find(c => c.ID === skill.CategoryID);
                    return (
                      <tr key={skill.ID} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{skill.Name}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                            {category?.Name || 'Без категорії'}
                          </span>
                        </td>
                        <td className="px-4 py-2 space-x-2">
                          <button
                            onClick={() => handleEditSkill(skill)}
                            className="text-blue-600 hover:text-blue-900 mr-2"
                          >
                            Редагувати
                          </button>
                          <button
                            onClick={() => handleDeleteClick(skill.ID)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Видалити
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Модальні вікна */}
        <CreateCategoryModal
          isOpen={isCreateCategoryModalOpen}
          onClose={() => setIsCreateCategoryModalOpen(false)}
          onSubmit={handleCreateCategory}
        />

        <CreateCategoryModal
          isOpen={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          onSubmit={handleUpdateCategory}
          initialData={editingCategory}
          isEditing
        />

        <ConfirmationModal
          isOpen={isDeleteCategoryModalOpen}
          onClose={() => setIsDeleteCategoryModalOpen(false)}
          onConfirm={handleDeleteCategory}
          title="Підтвердження видалення"
          message="Ви впевнені, що хочете видалити цю категорію? Всі навички в цій категорії стануть без категорії."
        />

        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Підтвердження видалення"
          message="Ви впевнені, що хочете видалити цю навичку? Цю дію неможливо скасувати."
        />

        <CreateSkillModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSkill}
          categories={categories}
        />

        <CreateSkillModal
          isOpen={!!editingSkill}
          onClose={() => setEditingSkill(null)}
          onSubmit={(skillData) => {
            handleUpdateSkill(editingSkill!.ID, skillData);
            setEditingSkill(null);
          }}
          categories={categories}
          initialData={editingSkill}
          isEditing
        />
      </div>
    </div>
  );
};

export default AdminSkills;
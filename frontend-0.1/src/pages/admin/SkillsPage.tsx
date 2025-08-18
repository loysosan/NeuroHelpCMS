import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ConfirmationModal } from '../../components/admin/modals/ConfirmationModal';
import { SkillModal } from '../../components/admin/modals/SkillModal';
import { SkillCategoryModal } from '../../components/admin/modals/SkillCategoryModal';

interface Skill {
  ID: number;
  Name: string;
  CategoryID: number;
  CreatedAt: string;
  UpdatedAt: string;
}

interface Category {
  ID: number;
  Name: string;
  CreatedAt: string;
  UpdatedAt: string;
}

const SkillsPage: React.FC = () => {
  const { token } = useAdminAuth();

  const [skills,setSkills]=useState<Skill[]>([]);
  const [categories,setCategories]=useState<Category[]>([]);
  const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);

  // Modals
  const [isCreateSkillOpen,setIsCreateSkillOpen]=useState(false);
  const [editingSkill,setEditingSkill]=useState<Skill|null>(null);
  const [skillToDelete,setSkillToDelete]=useState<number|null>(null);
  const [isDeleteSkillModalOpen,setIsDeleteSkillModalOpen]=useState(false);

  const [isCreateCategoryOpen,setIsCreateCategoryOpen]=useState(false);
  const [editingCategory,setEditingCategory]=useState<Category|null>(null);
  const [categoryToDelete,setCategoryToDelete]=useState<number|null>(null);
  const [isDeleteCategoryModalOpen,setIsDeleteCategoryModalOpen]=useState(false);

  const fetchSkills=async()=>{
    try{
      const res=await fetch('/api/admin/skills',{ headers:{ Authorization:`Bearer ${token}` }});
      if(!res.ok) throw new Error('Не вдалося завантажити навички');
      const data=await res.json();
      setSkills(data);
    }catch(e:any){
      setError(e.message);
    }
  };

  const fetchCategories=async()=>{
    try{
      const res=await fetch('/api/admin/skills/categories',{ headers:{ Authorization:`Bearer ${token}` }});
      if(!res.ok) throw new Error('Не вдалося завантажити категорії');
      const data=await res.json();
      setCategories(data);
    }catch(e:any){
      setError(e.message);
    }
  };

  useEffect(()=>{
    if(!token) return;
    (async()=>{
      setLoading(true);
      await Promise.all([fetchSkills(),fetchCategories()]);
      setLoading(false);
    })();
  },[token]);

  const handleCreateSkill=async(skillData:any)=>{
    try{
      const res=await fetch('/api/admin/skills',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          Authorization:`Bearer ${token}`
        },
        body: JSON.stringify(skillData)
      });
      if(!res.ok) throw new Error('Не вдалося створити навичку');
      setIsCreateSkillOpen(false);
      await fetchSkills();
    }catch(e:any){ setError(e.message); }
  };

  const handleUpdateSkill=async(skillId:number, skillData:any)=>{
    try{
      const res=await fetch(`/api/admin/skills/${skillId}`,{
        method:'PUT',
        headers:{
          'Content-Type':'application/json',
          Authorization:`Bearer ${token}`
        },
        body: JSON.stringify(skillData)
      });
      if(!res.ok) throw new Error('Не вдалося оновити навичку');
      setEditingSkill(null);
      await fetchSkills();
    }catch(e:any){ setError(e.message); }
  };

  const handleDeleteSkillConfirm=async()=>{
    if(!skillToDelete) return;
    try{
      const res=await fetch(`/api/admin/skills/${skillToDelete}`,{
        method:'DELETE',
        headers:{ Authorization:`Bearer ${token}` }
      });
      if(!res.ok) throw new Error('Не вдалося видалити навичку');
      setSkills(s=>s.filter(sk=>sk.ID!==skillToDelete));
      setIsDeleteSkillModalOpen(false);
      setSkillToDelete(null);
    }catch(e:any){ setError(e.message); }
  };

  const handleCreateCategory=async(categoryData:{Name:string})=>{
    try{
      const res=await fetch('/api/admin/skills/categories',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          Authorization:`Bearer ${token}`
        },
        body: JSON.stringify(categoryData)
      });
      if(!res.ok) throw new Error('Не вдалося створити категорію');
      await fetchCategories();
      setIsCreateCategoryOpen(false);
    }catch(e:any){ setError(e.message); }
  };

  const handleUpdateCategory=async(categoryData:{Name:string})=>{
    if(!editingCategory) return;
    try{
      const res=await fetch(`/api/admin/skills/categories/${editingCategory.ID}`,{
        method:'PUT',
        headers:{
          'Content-Type':'application/json',
          Authorization:`Bearer ${token}`
        },
        body: JSON.stringify(categoryData)
      });
      if(!res.ok) throw new Error('Не вдалося оновити категорію');
      await fetchCategories();
      setEditingCategory(null);
    }catch(e:any){ setError(e.message); }
  };

  const handleDeleteCategoryConfirm=async()=>{
    if(!categoryToDelete) return;
    try{
      const res=await fetch(`/api/admin/skills/categories/${categoryToDelete}`,{
        method:'DELETE',
        headers:{ Authorization:`Bearer ${token}` }
      });
      if(!res.ok) throw new Error('Не вдалося видалити категорію');
      setCategories(c=>c.filter(cat=>cat.ID!==categoryToDelete));
      setIsDeleteCategoryModalOpen(false);
      setCategoryToDelete(null);
      await fetchSkills(); // оновити навички (може втратитись зв’язок)
    }catch(e:any){ setError(e.message); }
  };

  if(loading){
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"/>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Керування навичками</h2>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Категорії */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Категорії</h2>
            <button
              onClick={()=>setIsCreateCategoryOpen(true)}
              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              + Додати
            </button>
          </div>
          <div className="space-y-2">
            {categories.map(category=>(
              <div
                key={category.ID}
                className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100"
              >
                <span>{category.Name}</span>
                <div className="space-x-2">
                  <button
                    onClick={()=>setEditingCategory(category)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ✎
                  </button>
                  <button
                    onClick={()=>{
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
            {categories.length===0 && (
              <div className="text-sm text-gray-500">Немає категорій</div>
            )}
          </div>
        </div>

        {/* Навички */}
        <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Навички</h2>
            <button
              onClick={()=>setIsCreateSkillOpen(true)}
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
                {skills.map(skill=>{
                  const category=categories.find(c=>c.ID===skill.CategoryID);
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
                          onClick={()=>setEditingSkill(skill)}
                          className="text-blue-600 hover:text-blue-900 mr-2"
                        >
                          Редагувати
                        </button>
                        <button
                          onClick={()=>{
                            setSkillToDelete(skill.ID);
                            setIsDeleteSkillModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Видалити
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {skills.length===0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500 text-sm">
                      Навичок немає
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Модалки */}
      <SkillModal
        isOpen={isCreateSkillOpen}
        onClose={()=>setIsCreateSkillOpen(false)}
        onSubmit={handleCreateSkill}
        categories={categories}
      />

      <SkillModal
        isOpen={!!editingSkill}
        onClose={()=>setEditingSkill(null)}
        onSubmit={(data)=> editingSkill && handleUpdateSkill(editingSkill.ID,data)}
        categories={categories}
        initialData={editingSkill ? { ID: editingSkill.ID, Name: editingSkill.Name, CategoryID: editingSkill.CategoryID } : undefined}
        isEditing
      />

      <SkillCategoryModal
        isOpen={isCreateCategoryOpen}
        onClose={()=>setIsCreateCategoryOpen(false)}
        onSubmit={handleCreateCategory}
      />

      <SkillCategoryModal
        isOpen={!!editingCategory}
        onClose={()=>setEditingCategory(null)}
        onSubmit={handleUpdateCategory}
        initialData={editingCategory ? { ID: editingCategory.ID, Name: editingCategory.Name } : undefined}
        isEditing
      />

      <ConfirmationModal
        isOpen={isDeleteSkillModalOpen}
        onClose={()=>{ setIsDeleteSkillModalOpen(false); setSkillToDelete(null); }}
        onConfirm={handleDeleteSkillConfirm}
        title="Підтвердження видалення"
        message="Ви впевнені, що хочете видалити цю навичку? Цю дію неможливо скасувати."
      />

      <ConfirmationModal
        isOpen={isDeleteCategoryModalOpen}
        onClose={()=>{ setIsDeleteCategoryModalOpen(false); setCategoryToDelete(null); }}
        onConfirm={handleDeleteCategoryConfirm}
        title="Підтвердження видалення"
        message="Ви впевнені, що хочете видалити цю категорію? Всі навички в цій категорії стануть без категорії."
      />
    </div>
  );
};

export default SkillsPage;
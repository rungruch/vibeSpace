import React, { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../../api/setting.ts';
import { useTheme } from '../../context/themeContext.js';
import { SaveOutlined, PlusOutlined, DeleteOutlined} from '@ant-design/icons';
import { message } from 'antd';
import { Input, Button } from 'antd';
import { HeroSectionSettings, HeroSectionData} from '../App/Interfaces/interface.ts';
import SelectPage from './SelectPage.tsx';
import SelectFile from './SelectFile.tsx';
import { SelectFileFilter, SettingsGroup } from '../enum.ts';

// TODOS handle error and loading states
const SettingsMainPage = () => {
  const [loading, setLoading] = useState(true);
  const [heroSections, setHeroSections] = useState<HeroSectionData[]>([]);
  const [showSelectPage, setShowSelectPage] = useState(false);
  const [showSelectFile, setShowSelectFile] = useState(false);
  const [newHero, setNewHero] = useState<HeroSectionData>({
    title: '',
    img_url: '',
    route: '',
  });
  const [mainPageData, setMainPageData] = useState<Record<string, any[]>>({});
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newPage, setNewPage] = useState({ title: '', route: '' });
  const [showSelectPageForMain, setShowSelectPageForMain] = useState(false);
  const { isDark } = useTheme();


  // Fetch files from API
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await getSettings();
    // Parse herosection.data if it's a string
        const heroSectionSetting = response.find((item: any) => item.name.trim() === "herosection");
        if (heroSectionSetting && heroSectionSetting.data) {
          try {
            const heroData = JSON.parse(heroSectionSetting.data);
            // If heroData has a 'data' property, use it; otherwise, use heroData directly
            setHeroSections(Array.isArray(heroData.data) ? heroData.data : heroData);
          } catch (e) {
            setHeroSections([]);
          }
        }
        
        // Parse mainpage.data if it's a string
        const mainPageSetting = response.find((item: any) => item.name.trim() === "mainpage");
        if (mainPageSetting && mainPageSetting.data) {
          try {
            const mainData = JSON.parse(mainPageSetting.data);
            setMainPageData(mainData.data || mainData);
          } catch (e) {
            setMainPageData({});
          }
        }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Add new hero section
  const handleAddHeroSection = () => {
    if (!newHero.title || !newHero.route) {
      message.error('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    // Ensure id is present
    setHeroSections(prev => [...prev, { ...newHero } as HeroSectionData]);
    setNewHero({
        title: '',
        img_url: '',
        route: '',
    });
    console.log(heroSections)
  };

  // Add new category
  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      message.error('กรุณาใส่ชื่อหมวดหมู่');
      return;
    }
    if (mainPageData[newCategory]) {
      message.error('หมวดหมู่นี้มีอยู่แล้ว');
      return;
    }
    setMainPageData(prev => ({ ...prev, [newCategory]: [] }));
    setNewCategory('');
  };

  // Add new page to category
  const handleAddPageToCategory = () => {
    if (!selectedCategory || !newPage.title || !newPage.route) {
      message.error('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    setMainPageData(prev => ({
      ...prev,
      [selectedCategory]: [...(prev[selectedCategory] || []), { ...newPage }]
    }));
    setNewPage({ title: '', route: '' });
  };

  // Remove page from category
  const handleRemovePage = (categoryKey: string, pageIndex: number) => {
    setMainPageData(prev => ({
      ...prev,
      [categoryKey]: prev[categoryKey].filter((_, idx) => idx !== pageIndex)
    }));
  };

  // Remove entire category
  const handleRemoveCategory = (categoryKey: string) => {
    setMainPageData(prev => {
      const newData = { ...prev };
      delete newData[categoryKey];
      return newData;
    });
  };

  // Remove hero section
  const handleRemoveHeroSection = (id: string) => {
    setHeroSections(prev => prev.filter(h => (h as any).id !== id));
  };


  return (
    <div className={`mx-auto mt-10 p-6 rounded-xl shadow-lg border transition-colors ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
      <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Hero Section Settings</h2>
      <div className="mb-6">
        <div className="flex flex-col gap-4 mb-4">
          <input
            type="text"
            placeholder="ชื่อ Hero Section"
            value={newHero.title || ''}
            onChange={e => setNewHero(h => ({ ...h, title: e.target.value }))}
            className={`px-3 py-2 border rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          />
          <div>
            <Input
              placeholder="เลือกไฟล์หรือวางลิงก์ภาพ"
              value={newHero.img_url || ''}
              onChange={e => setNewHero(h => ({ ...h, img_url: e.target.value }))}
              addonAfter={<Button onClick={() => setShowSelectFile(true)}>เลือกจากไฟล์</Button>}
            />
            {newHero.img_url && (
              <div style={{ marginTop: 12 }}>
                <img
                  src={newHero.img_url}
                  alt="cover preview"
                  style={{ maxWidth: 180, maxHeight: 180, borderRadius: 8, border: '1px solid #eee' }}
                  onError={e => {
                    setNewHero(h => ({ ...h, img_url: '' }));
                  }}
                />
              </div>
            )}
          </div>
          <div>
            <button
              className={`px-4 py-2 rounded font-semibold transition ${isDark ? 'bg-blue-700 text-white hover:bg-blue-800' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              onClick={() => setShowSelectPage(true)}
            >
              {newHero.route ? `เลือกใหม่: ${newHero.route}` : 'เลือกเพจสำหรับ Hero Section'}
            </button>
          </div>
          <button
            className={`px-4 py-2 rounded font-semibold transition ${isDark ? 'bg-green-700 text-white hover:bg-green-800' : 'bg-green-600 text-white hover:bg-green-700'}`}
            onClick={handleAddHeroSection}
          >
            <PlusOutlined /> เพิ่ม Hero Section
          </button>
        </div>
        <div>
          <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>รายการ Hero Section</h3>
          {heroSections.length === 0 ? (
            <div className={`text-gray-500 ${isDark ? 'text-zinc-300' : ''}`}>ยังไม่มี Hero Section</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {heroSections.map((hero) => (
                <li key={hero.title} className="py-2 flex justify-between items-center">
                  <span>{hero.title} <span className="text-xs text-gray-400">({hero.route})</span></span>
                  <button
                    className="p-2 rounded hover:bg-red-100 text-red-600 hover:text-red-800"
                    onClick={() => handleRemoveHeroSection(hero.title)}
                  >
                    <DeleteOutlined /> ลบ
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 text-right">
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={async () => {
                try {
                  await updateSettings({
                    name: SettingsGroup.HeroSection,
                    data: JSON.stringify({
                        posts_show_length: heroSections.length,
                        data: heroSections
                    } as HeroSectionSettings)
                   });
                  message.success('บันทึก Hero Section สำเร็จ');
                } catch (err) {
                  message.error('เกิดข้อผิดพลาดในการบันทึก');
                }
              }}
            >
              บันทึกการตั้งค่า
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Page Settings Section */}
      <section className="mb-10">
        <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Main Page Settings</h2>
        <div className="mb-6">
          {/* Add New Category */}
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="ชื่อหมวดหมู่ใหม่"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className={`px-3 py-2 border rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
            <button
              className={`px-4 py-2 rounded font-semibold transition ${isDark ? 'bg-purple-700 text-white hover:bg-purple-800' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
              onClick={handleAddCategory}
            >
              <PlusOutlined /> เพิ่มหมวดหมู่
            </button>
          </div>

          {/* Add Page to Category */}
          <div className="flex flex-col gap-4 mb-6 p-4 border rounded-lg">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className={`px-3 py-2 border rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="">เลือกหมวดหมู่</option>
              {Object.keys(mainPageData).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="ชื่อหน้า"
              value={newPage.title}
              onChange={e => setNewPage(p => ({ ...p, title: e.target.value }))}
              className={`px-3 py-2 border rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Route path"
                value={newPage.route}
                onChange={e => setNewPage(p => ({ ...p, route: e.target.value }))}
                className={`flex-1 px-3 py-2 border rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
              <button
                className={`px-4 py-2 rounded font-semibold transition ${isDark ? 'bg-blue-700 text-white hover:bg-blue-800' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                onClick={() => setShowSelectPageForMain(true)}
              >
                เลือกเพจ
              </button>
            </div>
            <button
              className={`px-4 py-2 rounded font-semibold transition ${isDark ? 'bg-green-700 text-white hover:bg-green-800' : 'bg-green-600 text-white hover:bg-green-700'}`}
              onClick={handleAddPageToCategory}
            >
              <PlusOutlined /> เพิ่มหน้าในหมวดหมู่
            </button>
          </div>

          {/* Display Categories and Pages */}
          <div>
            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>รายการหมวดหมู่และหน้า</h3>
            {Object.keys(mainPageData).length === 0 ? (
              <div className={`text-gray-500 ${isDark ? 'text-zinc-300' : ''}`}>ยังไม่มีหมวดหมู่</div>
            ) : (
              Object.entries(mainPageData).map(([categoryKey, pages]) => (
                <div key={categoryKey} className="mb-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{categoryKey}</h4>
                    <button
                      className="p-2 rounded hover:bg-red-100 text-red-600 hover:text-red-800"
                      onClick={() => handleRemoveCategory(categoryKey)}
                    >
                      <DeleteOutlined /> ลบหมวดหมู่
                    </button>
                  </div>
                  {pages.length === 0 ? (
                    <div className={`text-gray-500 text-sm ${isDark ? 'text-zinc-400' : ''}`}>ไม่มีหน้าในหมวดหมู่นี้</div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {pages.map((page, idx) => (
                        <li key={idx} className="py-2 flex justify-between items-center">
                          <span>{page.title} <span className="text-xs text-gray-400">({page.route})</span></span>
                          <button
                            className="p-1 rounded hover:bg-red-100 text-red-600 hover:text-red-800"
                            onClick={() => handleRemovePage(categoryKey, idx)}
                          >
                            <DeleteOutlined />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            )}
            <div className="mt-6 text-right">
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={async () => {
                  try {
                    await updateSettings({
                      name: SettingsGroup.MainPage,
                      data: JSON.stringify(mainPageData)
                    });
                    message.success('บันทึก Main Page Settings สำเร็จ');
                  } catch (err) {
                    message.error('เกิดข้อผิดพลาดในการบันทึก');
                  }
                }}
              >
                บันทึกการตั้งค่า Main Page
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* SelectFile Modal for img_url */}
      {showSelectFile && (
        <SelectFile
          visible={showSelectFile}
          onClose={() => setShowSelectFile(false)}
          onSelect={img_url => {
            setNewHero(h => ({ ...h, img_url }));
            setShowSelectFile(false);
          }}
          filterType={SelectFileFilter.IMAGE}
        />
      )}
      {/* SelectPage Modal */}
      {showSelectPage && (
        <React.Suspense fallback={null}>
          <SelectPage
            visible={showSelectPage}
            onClose={() => setShowSelectPage(false)}
            onSelect={route => {
              setNewHero(h => ({ ...h, route }));
              setShowSelectPage(false);
            }}
          />
        </React.Suspense>
      )}
      {/* SelectPage Modal for Main Page */}
      {showSelectPageForMain && (
        <React.Suspense fallback={null}>
          <SelectPage
            visible={showSelectPageForMain}
            onClose={() => setShowSelectPageForMain(false)}
            onSelect={route => {
              setNewPage(p => ({ ...p, route }));
              setShowSelectPageForMain(false);
            }}
          />
        </React.Suspense>
      )}
    </div>
  );
};

export default SettingsMainPage;
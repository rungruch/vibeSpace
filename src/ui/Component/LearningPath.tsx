import React, { useMemo, useState } from 'react';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import QuizIcon from '@mui/icons-material/Quiz';
import { Steps } from 'antd';
import type { StepProps } from 'antd';

type Props = {
  modulesRaw?: any;
  isDark?: boolean;
  onLessonSelect?: (moduleIndex: number, lessonIndex: number, lesson: any) => void;
  interactive?: boolean;
};

export default function LearningPath({ modulesRaw, isDark = false, onLessonSelect, interactive = true }: Props) {
  // parse modules (string or array) and normalize
  const modules = useMemo(() => {
    let raw = modulesRaw;
    let list: any[] = [];

    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed.slice();
      } catch (e) {
        list = [];
      }
    } else if (Array.isArray(raw)) {
      list = raw.slice();
    }

    // normalize module fields and lessons
    return list.map((m: any) => ({
      module_id: m.module_id || m.id,
      module_title: m.module_title || m.title,
      module_order: m.module_order ?? m.order_index ?? 0,
      lessons: (m.lessons || m.items || []).map((l: any) => ({
        lesson_id: l.lesson_id || l.id,
        lesson_title: l.lesson_title || l.title,
        lesson_type: l.lesson_type || l.type,
        lesson_order: l.lesson_order ?? l.order_index ?? 0,
        ...l,
      })),
    }))
    .sort((a: any, b: any) => (a.module_order || 0) - (b.module_order || 0));
  }, [modulesRaw]);

  const [activeModule, setActiveModule] = useState(interactive ? 0 : -1);
  const [activeLesson, setActiveLesson] = useState(interactive ? 0 : -1);

  if (!modules || modules.length === 0) {
    return (
      <div className={`text-sm ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>
        ไม่มีบทเรียน
      </div>
    );
  }

  const handleLessonClick = (mi: number, li: number, lesson: any) => {
    setActiveModule(mi);
    setActiveLesson(li);
    if (onLessonSelect) onLessonSelect(mi, li, lesson);
    // keep behavior minimal: user can extend navigation callback
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Lessons steps stacked by module */}
      <div className={`w-full p-2 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
        {modules.map((m: any, mi: number) => (
          <div key={m.module_id || mi} className="mb-6">
            <div className={`text-sm font-medium mb-2 ${isDark ? 'text-zinc-200' : 'text-gray-800'}`}>
              {m.module_title}
            </div>

            <Steps
              size="small"
              current={mi === activeModule ? activeLesson : -1}
              onChange={(stepIndex) => {
                if (!interactive) return;
                // only allow selecting within active module; clicking a step from another module activates that module
                if (mi !== activeModule) setActiveModule(mi);
                setActiveLesson(Number(stepIndex));
                const lesson = (m.lessons || [])[Number(stepIndex)];
                if (lesson && onLessonSelect) onLessonSelect(mi, Number(stepIndex), lesson);
              }}
              className={`rounded-md ${isDark ? 'ant-steps-dark' : ''}`}
              style={{ pointerEvents: interactive ? undefined : 'none' }}
              aria-disabled={!interactive}
            >
              {(m.lessons || [])
                .slice()
                .sort((a: any, b: any) => (a.lesson_order || 0) - (b.lesson_order || 0))
                .map((lesson: any, li: number) => {
                  const icon = lesson.lesson_type === 'video' ? (
                    <PlayCircleOutlineIcon />
                  ) : lesson.lesson_type === 'pdf' ? (
                    <PictureAsPdfIcon />
                  ) : lesson.lesson_type === 'quiz' ? (
                    <QuizIcon />
                  ) : (
                    <MenuBookIcon />
                  );

                  // Antd Steps.Step doesn't accept arbitrary children in older versions; use title/description props
                  const stepProps: StepProps = {
                    title: <div className={`truncate ${isDark ? 'text-zinc-100' : 'text-gray-900'}`}>{lesson.lesson_title}</div>,
                    description: <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{lesson.lesson_type}</div>,
                    icon,
                  };

                  return <Steps.Step key={lesson.lesson_id || li} {...stepProps} />;
                })}
            </Steps>
          </div>
        ))}
      </div>
    </div>
  );
}

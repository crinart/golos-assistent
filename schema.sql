-- Схема базы данных для Внутреннего инструмента карт
-- Создание таблиц и настройка RLS (Row Level Security)

-- Включение расширения для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица точек
CREATE TABLE IF NOT EXISTS points (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    comment TEXT,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица линий ЛЭП
CREATE TABLE IF NOT EXISTS lines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    point_ids UUID[] NOT NULL DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_points_user_id ON points(user_id);
CREATE INDEX IF NOT EXISTS idx_points_created_at ON points(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_location ON points(lat, lng);

CREATE INDEX IF NOT EXISTS idx_lines_user_id ON lines(user_id);
CREATE INDEX IF NOT EXISTS idx_lines_created_at ON lines(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lines_point_ids ON lines USING GIN(point_ids);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_points_updated_at 
    BEFORE UPDATE ON points 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lines_updated_at 
    BEFORE UPDATE ON lines 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Включение Row Level Security (RLS)
ALTER TABLE points ENABLE ROW LEVEL SECURITY;
ALTER TABLE lines ENABLE ROW LEVEL SECURITY;

-- Политики RLS для таблицы points
-- Пользователи могут видеть только свои точки
CREATE POLICY "Пользователи видят только свои точки" ON points
    FOR SELECT USING (auth.uid() = user_id);

-- Пользователи могут создавать только свои точки
CREATE POLICY "Пользователи создают только свои точки" ON points
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Пользователи могут обновлять только свои точки
CREATE POLICY "Пользователи обновляют только свои точки" ON points
    FOR UPDATE USING (auth.uid() = user_id);

-- Пользователи могут удалять только свои точки
CREATE POLICY "Пользователи удаляют только свои точки" ON points
    FOR DELETE USING (auth.uid() = user_id);

-- Политики RLS для таблицы lines
-- Пользователи могут видеть только свои линии
CREATE POLICY "Пользователи видят только свои линии" ON lines
    FOR SELECT USING (auth.uid() = user_id);

-- Пользователи могут создавать только свои линии
CREATE POLICY "Пользователи создают только свои линии" ON lines
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Пользователи могут обновлять только свои линии
CREATE POLICY "Пользователи обновляют только свои линии" ON lines
    FOR UPDATE USING (auth.uid() = user_id);

-- Пользователи могут удалять только свои линии
CREATE POLICY "Пользователи удаляют только свои линии" ON lines
    FOR DELETE USING (auth.uid() = user_id);

-- Комментарии к таблицам и столбцам
COMMENT ON TABLE points IS 'Таблица для хранения точек на карте';
COMMENT ON COLUMN points.id IS 'Уникальный идентификатор точки';
COMMENT ON COLUMN points.title IS 'Название точки';
COMMENT ON COLUMN points.comment IS 'Комментарий к точке';
COMMENT ON COLUMN points.lat IS 'Широта точки';
COMMENT ON COLUMN points.lng IS 'Долгота точки';
COMMENT ON COLUMN points.user_id IS 'ID пользователя, создавшего точку';
COMMENT ON COLUMN points.created_at IS 'Время создания точки';
COMMENT ON COLUMN points.updated_at IS 'Время последнего обновления точки';

COMMENT ON TABLE lines IS 'Таблица для хранения линий ЛЭП';
COMMENT ON COLUMN lines.id IS 'Уникальный идентификатор линии';
COMMENT ON COLUMN lines.name IS 'Название линии';
COMMENT ON COLUMN lines.point_ids IS 'Массив ID точек, составляющих линию';
COMMENT ON COLUMN lines.user_id IS 'ID пользователя, создавшего линию';
COMMENT ON COLUMN lines.created_at IS 'Время создания линии';
COMMENT ON COLUMN lines.updated_at IS 'Время последнего обновления линии';

-- Создание представлений для удобства работы
CREATE OR REPLACE VIEW user_points_with_stats AS
SELECT 
    p.*,
    COUNT(l.id) as lines_count
FROM points p
LEFT JOIN lines l ON p.id = ANY(l.point_ids) AND l.user_id = p.user_id
WHERE p.user_id = auth.uid()
GROUP BY p.id, p.title, p.comment, p.lat, p.lng, p.user_id, p.created_at, p.updated_at;

CREATE OR REPLACE VIEW user_lines_with_stats AS
SELECT 
    l.*,
    array_length(l.point_ids, 1) as points_count
FROM lines l
WHERE l.user_id = auth.uid();

-- Функция для получения статистики пользователя
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'points_count', (SELECT COUNT(*) FROM points WHERE user_id = auth.uid()),
        'lines_count', (SELECT COUNT(*) FROM lines WHERE user_id = auth.uid()),
        'total_line_points', (
            SELECT COALESCE(SUM(array_length(point_ids, 1)), 0) 
            FROM lines 
            WHERE user_id = auth.uid()
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для валидации координат
CREATE OR REPLACE FUNCTION validate_coordinates(lat DECIMAL, lng DECIMAL)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN lat >= -90 AND lat <= 90 AND lng >= -180 AND lng <= 180;
END;
$$ LANGUAGE plpgsql;

-- Ограничения для валидации данных
ALTER TABLE points ADD CONSTRAINT check_valid_coordinates 
    CHECK (validate_coordinates(lat, lng));

ALTER TABLE points ADD CONSTRAINT check_title_not_empty 
    CHECK (LENGTH(TRIM(title)) > 0);

ALTER TABLE lines ADD CONSTRAINT check_name_not_empty 
    CHECK (LENGTH(TRIM(name)) > 0);

ALTER TABLE lines ADD CONSTRAINT check_minimum_points 
    CHECK (array_length(point_ids, 1) >= 2);

-- Создание функции для очистки данных пользователя
CREATE OR REPLACE FUNCTION clear_user_data()
RETURNS VOID AS $$
BEGIN
    DELETE FROM lines WHERE user_id = auth.uid();
    DELETE FROM points WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создание функции для экспорта данных пользователя
CREATE OR REPLACE FUNCTION export_user_data()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'points', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'id', id,
                    'title', title,
                    'comment', comment,
                    'lat', lat,
                    'lng', lng,
                    'created_at', created_at
                )
            ), '[]'::json)
            FROM points 
            WHERE user_id = auth.uid()
            ORDER BY created_at DESC
        ),
        'lines', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'id', id,
                    'name', name,
                    'point_ids', point_ids,
                    'created_at', created_at
                )
            ), '[]'::json)
            FROM lines 
            WHERE user_id = auth.uid()
            ORDER BY created_at DESC
        ),
        'exported_at', NOW(),
        'user_id', auth.uid()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


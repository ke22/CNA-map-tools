/**
 * Label Manager - 标签管理系统
 * 
 * 功能：
 * - 创建和管理地图标签
 * - 支持中文标签
 * - 标签拖拽功能
 * - 标签位置保存
 */

class LabelManager {
    constructor(map, appState) {
        this.map = map;
        this.appState = appState;
        this.labels = new Map(); // Map<labelId, labelData>
        this.draggingEnabled = false;
        this.currentDragLabel = null;

        // 初始化标签图层
        this.initializeLabelLayers();

        console.log('✅ LabelManager initialized');
    }

    /**
     * 初始化标签图层
     */
    initializeLabelLayers() {
        // 等待地图加载完成
        if (!this.map.isStyleLoaded()) {
            this.map.once('load', () => this.createLabelLayers());
        } else {
            this.createLabelLayers();
        }
    }

    /**
     * 创建标签图层
     */
    createLabelLayers() {
        // 创建标签数据源
        if (!this.map.getSource('area-labels-source')) {
            this.map.addSource('area-labels-source', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });
        }

        // 创建标签图层
        if (!this.map.getLayer('area-labels')) {
            this.map.addLayer({
                id: 'area-labels',
                type: 'symbol',
                source: 'area-labels-source',
                layout: {
                    'text-field': ['get', 'text'],
                    'text-font': ['Noto Sans Regular'],
                    'text-size': ['get', 'fontSize'],
                    'text-anchor': ['get', 'anchor'],
                    'text-offset': [0, 0],
                    'text-allow-overlap': true,
                    'text-ignore-placement': false
                },
                paint: {
                    'text-color': ['get', 'color'],
                    'text-halo-color': '#ffffff',
                    'text-halo-width': 2,
                    'text-halo-blur': 1
                }
            });

            console.log('✅ Created area-labels layer');
        }

        // 创建边界标签图层（备用）
        if (!this.map.getSource('boundary-labels-source')) {
            this.map.addSource('boundary-labels-source', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });
        }

        if (!this.map.getLayer('boundary-labels')) {
            this.map.addLayer({
                id: 'boundary-labels',
                type: 'symbol',
                source: 'boundary-labels-source',
                layout: {
                    'text-field': ['get', 'text'],
                    'text-font': ['Noto Sans Regular'],
                    'text-size': 14,
                    'text-anchor': 'center'
                },
                paint: {
                    'text-color': '#333333',
                    'text-halo-color': '#ffffff',
                    'text-halo-width': 2
                }
            });

            console.log('✅ Created boundary-labels layer');
        }
    }

    /**
     * 创建标签
     * @param {Object} options - 标签选项
     * @returns {string} - 标签 ID
     */
    create(options) {
        const {
            areaId,
            areaName,
            coordinates,
            text = null,
            fontSize = 14,
            color = '#333333',
            anchor = 'center',
            offset = [0, 0]
        } = options;

        // 生成标签 ID
        const labelId = areaId || `label-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // 获取标签文本（优先使用提供的文本，否则尝试获取中文标签）
        let labelText = text;
        if (!labelText && areaName) {
            labelText = this.getChineseLabel(areaName) || areaName;
        }

        if (!labelText) {
            console.warn('No label text provided');
            return null;
        }

        // 创建标签数据
        const labelData = {
            id: labelId,
            areaId,
            areaName,
            text: labelText,
            coordinates,
            fontSize,
            color,
            anchor,
            offset
        };

        // 保存标签
        this.labels.set(labelId, labelData);

        // 更新地图
        this.updateMapLabels();

        console.log(`✅ Created label: ${labelText} at`, coordinates);

        return labelId;
    }

    /**
     * 更新地图标签
     */
    updateMapLabels() {
        const features = Array.from(this.labels.values()).map(label => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [
                    label.coordinates[0] + (label.offset[0] || 0),
                    label.coordinates[1] + (label.offset[1] || 0)
                ]
            },
            properties: {
                id: label.id,
                text: label.text,
                fontSize: label.fontSize,
                color: label.color,
                anchor: label.anchor
            }
        }));

        const source = this.map.getSource('area-labels-source');
        if (source) {
            source.setData({
                type: 'FeatureCollection',
                features
            });
        }
    }

    /**
     * 删除标签
     * @param {string} labelId - 标签 ID
     */
    remove(labelId) {
        if (this.labels.has(labelId)) {
            this.labels.delete(labelId);
            this.updateMapLabels();
            console.log(`✅ Removed label: ${labelId}`);
            return true;
        }
        return false;
    }

    /**
     * 清除所有标签
     */
    clear() {
        this.labels.clear();
        this.updateMapLabels();
        console.log('✅ Cleared all labels');
    }

    /**
     * 启用标签拖拽
     */
    enableDrag() {
        if (this.draggingEnabled) return;

        this.draggingEnabled = true;

        // 添加拖拽事件监听器
        this.map.on('mousedown', 'area-labels', this.onDragStart.bind(this));
        this.map.on('mousemove', this.onDrag.bind(this));
        this.map.on('mouseup', this.onDragEnd.bind(this));

        // 改变光标样式
        this.map.on('mouseenter', 'area-labels', () => {
            this.map.getCanvas().style.cursor = 'move';
        });

        this.map.on('mouseleave', 'area-labels', () => {
            if (!this.currentDragLabel) {
                this.map.getCanvas().style.cursor = '';
            }
        });

        console.log('✅ Label dragging enabled');
    }

    /**
     * 禁用标签拖拽
     */
    disableDrag() {
        if (!this.draggingEnabled) return;

        this.draggingEnabled = false;

        // 移除事件监听器
        this.map.off('mousedown', 'area-labels', this.onDragStart.bind(this));
        this.map.off('mousemove', this.onDrag.bind(this));
        this.map.off('mouseup', this.onDragEnd.bind(this));

        this.map.getCanvas().style.cursor = '';

        console.log('✅ Label dragging disabled');
    }

    /**
     * 拖拽开始
     */
    onDragStart(e) {
        if (!this.draggingEnabled) return;

        e.preventDefault();

        const features = this.map.queryRenderedFeatures(e.point, {
            layers: ['area-labels']
        });

        if (features.length > 0) {
            const labelId = features[0].properties.id;
            this.currentDragLabel = labelId;
            this.map.getCanvas().style.cursor = 'grabbing';
        }
    }

    /**
     * 拖拽中
     */
    onDrag(e) {
        if (!this.currentDragLabel) return;

        const label = this.labels.get(this.currentDragLabel);
        if (!label) return;

        // 计算新的偏移量
        const newCoords = [e.lngLat.lng, e.lngLat.lat];
        const offset = [
            newCoords[0] - label.coordinates[0],
            newCoords[1] - label.coordinates[1]
        ];

        label.offset = offset;
        this.updateMapLabels();
    }

    /**
     * 拖拽结束
     */
    onDragEnd() {
        if (this.currentDragLabel) {
            // 保存标签位置
            this.savePosition(this.currentDragLabel);
            this.currentDragLabel = null;
            this.map.getCanvas().style.cursor = '';
        }
    }

    /**
     * 保存标签位置
     * @param {string} labelId - 标签 ID
     */
    savePosition(labelId) {
        const label = this.labels.get(labelId);
        if (!label) return;

        // 保存到 localStorage
        const savedPositions = JSON.parse(localStorage.getItem('labelPositions') || '{}');
        savedPositions[labelId] = {
            offset: label.offset,
            coordinates: label.coordinates
        };
        localStorage.setItem('labelPositions', JSON.stringify(savedPositions));

        console.log(`✅ Saved position for label: ${labelId}`);
    }

    /**
     * 加载保存的标签位置
     */
    loadSavedPositions() {
        const savedPositions = JSON.parse(localStorage.getItem('labelPositions') || '{}');

        for (const [labelId, position] of Object.entries(savedPositions)) {
            const label = this.labels.get(labelId);
            if (label) {
                label.offset = position.offset;
            }
        }

        this.updateMapLabels();
        console.log('✅ Loaded saved label positions');
    }

    /**
     * 获取中文标签
     * @param {string} name - 英文名称
     * @returns {string} - 中文名称
     */
    getChineseLabel(name) {
        if (typeof window.getChineseLabel === 'function') {
            return window.getChineseLabel(name);
        }

        // 如果全局函数不存在，返回原名称
        return name;
    }

    /**
     * 显示标签图层
     */
    show() {
        if (this.map.getLayer('area-labels')) {
            this.map.setLayoutProperty('area-labels', 'visibility', 'visible');
        }
        if (this.map.getLayer('boundary-labels')) {
            this.map.setLayoutProperty('boundary-labels', 'visibility', 'visible');
        }
        console.log('✅ Labels shown');
    }

    /**
     * 隐藏标签图层
     */
    hide() {
        if (this.map.getLayer('area-labels')) {
            this.map.setLayoutProperty('area-labels', 'visibility', 'none');
        }
        if (this.map.getLayer('boundary-labels')) {
            this.map.setLayoutProperty('boundary-labels', 'visibility', 'none');
        }
        console.log('✅ Labels hidden');
    }

    /**
     * 为选中的区域创建标签
     * @param {Object} area - 区域对象
     */
    createLabelForArea(area) {
        if (!area || !area.id) return;

        // 检查是否已存在标签
        if (this.labels.has(area.id)) {
            console.log(`Label already exists for area: ${area.id}`);
            return;
        }

        // 获取区域中心点
        const center = this.getAreaCenter(area);
        if (!center) {
            console.warn('Could not determine area center');
            return;
        }

        // 创建标签
        this.create({
            areaId: area.id,
            areaName: area.name,
            coordinates: center,
            fontSize: 14,
            color: '#333333'
        });
    }

    /**
     * 获取区域中心点
     * @param {Object} area - 区域对象
     * @returns {Array} - [lng, lat]
     */
    getAreaCenter(area) {
        // 如果区域有 center 属性，直接使用
        if (area.center) {
            return area.center;
        }

        // 如果区域有 bounds 属性，计算中心点
        if (area.bounds) {
            const bounds = area.bounds;
            return [
                (bounds[0] + bounds[2]) / 2,
                (bounds[1] + bounds[3]) / 2
            ];
        }

        // 尝试从地图数据中获取
        // 这里可以添加更复杂的逻辑来计算多边形的中心点

        return null;
    }
}

// 导出到全局
window.LabelManager = LabelManager;

// 便捷函数
window.createLabel = function (options) {
    if (window.labelManager) {
        return window.labelManager.create(options);
    }
    console.warn('LabelManager not initialized');
    return null;
};

window.addLabel = window.createLabel; // 别名

console.log('✅ LabelManager module loaded');

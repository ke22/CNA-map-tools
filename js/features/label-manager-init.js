/**
 * Label Manager Initialization
 * 初始化标签管理器并设置事件监听器
 */

(function () {
    'use strict';

    // 等待 DOM 和地图加载完成
    function initializeLabelManagerWhenReady() {
        // 检查必要的依赖是否已加载
        if (typeof window.LabelManager === 'undefined') {
            console.warn('⚠️ LabelManager not loaded yet, retrying...');
            setTimeout(initializeLabelManagerWhenReady, 100);
            return;
        }

        if (typeof window.appState === 'undefined' || !window.appState.map) {
            console.warn('⚠️ Map not ready yet, retrying...');
            setTimeout(initializeLabelManagerWhenReady, 100);
            return;
        }

        // 等待地图完全加载
        if (!window.appState.map.isStyleLoaded()) {
            window.appState.map.once('load', initializeLabelManager);
        } else {
            initializeLabelManager();
        }
    }

    function initializeLabelManager() {
        console.log('🏷️ Initializing Label Manager...');

        // 创建标签管理器实例
        window.labelManager = new window.LabelManager(window.appState.map, window.appState);

        // 设置事件监听器
        setupLabelControls();

        // 自动为已选择的区域创建标签（如果启用）
        const showLabelsCheckbox = document.getElementById('show-labels');
        if (showLabelsCheckbox && showLabelsCheckbox.checked) {
            window.labelManager.show();
        }

        console.log('✅ Label Manager initialized successfully');
    }

    function setupLabelControls() {
        // 标签显示/隐藏控件
        const showLabelsCheckbox = document.getElementById('show-labels');
        if (showLabelsCheckbox) {
            showLabelsCheckbox.addEventListener('change', function (e) {
                if (e.target.checked) {
                    window.labelManager.show();
                    console.log('✅ Labels shown');
                } else {
                    window.labelManager.hide();
                    console.log('✅ Labels hidden');
                }
            });
        }

        // 标签拖拽控件
        const enableDraggingCheckbox = document.getElementById('enable-label-dragging');
        if (enableDraggingCheckbox) {
            enableDraggingCheckbox.addEventListener('change', function (e) {
                if (e.target.checked) {
                    window.labelManager.enableDrag();
                    console.log('✅ Label dragging enabled');
                } else {
                    window.labelManager.disableDrag();
                    console.log('✅ Label dragging disabled');
                }
            });
        }
    }

    // 扩展 applyColorToArea 函数以自动创建标签
    if (typeof window.applyColorToArea === 'function') {
        const originalApplyColorToArea = window.applyColorToArea;

        window.applyColorToArea = function (areaId, areaName, areaType, color) {
            // 调用原始函数
            const result = originalApplyColorToArea.apply(this, arguments);

            // 如果标签管理器已初始化且标签显示已启用，创建标签
            if (window.labelManager) {
                const showLabelsCheckbox = document.getElementById('show-labels');
                if (showLabelsCheckbox && showLabelsCheckbox.checked) {
                    // 延迟创建标签，确保区域已添加到地图
                    setTimeout(() => {
                        // 查找对应的区域
                        const area = window.appState.selectedAreas.find(a =>
                            a.id === areaId || a.name === areaName
                        );

                        if (area) {
                            window.labelManager.createLabelForArea(area);
                        }
                    }, 500);
                }
            }

            return result;
        };
    }

    // 扩展 removeArea 函数以删除对应的标签
    if (typeof window.removeArea === 'function') {
        const originalRemoveArea = window.removeArea;

        window.removeArea = function (areaId) {
            // 删除标签
            if (window.labelManager) {
                window.labelManager.remove(areaId);
            }

            // 调用原始函数
            return originalRemoveArea.apply(this, arguments);
        };
    }

    // 扩展 clearAllAreas 函数以清除所有标签
    if (typeof window.clearAllAreas === 'function') {
        const originalClearAllAreas = window.clearAllAreas;

        window.clearAllAreas = function () {
            // 清除所有标签
            if (window.labelManager) {
                window.labelManager.clear();
            }

            // 调用原始函数
            return originalClearAllAreas.apply(this, arguments);
        };
    }

    // 初始化标签拖拽功能
    window.initLabelDragging = function () {
        if (window.labelManager) {
            window.labelManager.enableDrag();
            return true;
        }
        return false;
    };

    // 保存标签位置
    window.saveLabelPosition = function (labelId) {
        if (window.labelManager) {
            window.labelManager.savePosition(labelId);
            return true;
        }
        return false;
    };

    // 启动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeLabelManagerWhenReady);
    } else {
        initializeLabelManagerWhenReady();
    }

    console.log('📝 Label Manager initialization script loaded');
})();

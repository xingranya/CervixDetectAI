#!/usr/bin/env node

/**
 * Wiki文档自动生成脚本
 * 用于扫描项目结构并生成符合规范的wiki文档
 */

import fs from 'fs';
import path from 'path';

class WikiGenerator {
    constructor(options = {}) {
        this.options = {
            projectRoot: process.cwd(),
            wikiDir: './wiki',
            scanDepth: 10,
            lookbackDays: 7,
            ...options
        };
        
        this.fileCache = new Map();
        this.changeLog = [];
    }

    /**
     * 主执行函数
     */
    async generate() {
        console.log('🚀 开始生成wiki文档...');
        
        try {
            // 1. 扫描项目结构
            const projectStructure = await this.scanProject();
            
            // 2. 检测文件变更
            const changes = await this.detectChanges();
            
            // 3. 生成文档
            await this.generateDocuments(projectStructure, changes);
            
            // 4. 输出结果
            this.printSummary();
            
        } catch (error) {
            console.error('❌ 生成过程中出现错误:', error.message);
            throw error;
        }
    }

    /**
     * 扫描项目目录结构
     */
    async scanProject() {
        console.log('🔍 正在扫描项目结构...');
        
        const structure = {
            frontend: await this.analyzeDirectory('./src'),
            backend: await this.analyzeDirectory('./server'),
            config: await this.analyzeConfigFiles(),
            docs: await this.analyzeDocumentation()
        };

        return structure;
    }

    /**
     * 分析指定目录
     */
    async analyzeDirectory(dirPath) {
        if (!fs.existsSync(dirPath)) {
            return { error: `目录不存在: ${dirPath}` };
        }

        const result = {
            path: dirPath,
            files: [],
            directories: [],
            stats: {}
        };

        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const stats = fs.statSync(fullPath);
                
                if (stats.isDirectory()) {
                    // 递归分析子目录
                    if (this.shouldScanDirectory(item)) {
                        const subdir = await this.analyzeDirectory(fullPath);
                        result.directories.push({
                            name: item,
                            path: fullPath,
                            ...subdir
                        });
                    }
                } else {
                    // 分析文件
                    if (this.shouldProcessFile(item)) {
                        const fileInfo = await this.getFileMetadata(fullPath, stats);
                        result.files.push(fileInfo);
                    }
                }
            }
            
            result.stats = this.calculateStats(result);
            
        } catch (error) {
            console.warn(`分析目录失败 ${dirPath}:`, error.message);
        }

        return result;
    }

    /**
     * 获取文件元数据
     */
    async getFileMetadata(filePath, stats) {
        const ext = path.extname(filePath).toLowerCase();
        
        return {
            name: path.basename(filePath),
            path: filePath,
            extension: ext,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            type: this.getFileType(ext),
            references: await this.findReferences(filePath)
        };
    }

    /**
     * 查找文件引用关系
     */
    async findReferences(filePath) {
        const references = [];
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 查找import语句
        const importMatches = content.match(/import\s+.*?from\s+['"](.*?)['"]/g) || [];
        for (const match of importMatches) {
            const importPath = match.match(/['"](.*?)['"]/)[1];
            references.push({
                type: 'import',
                path: importPath,
                line: this.getLineNumberOfMatch(content, match)
            });
        }
        
        // 查找require语句
        const requireMatches = content.match(/require\s*\(\s*['"](.*?)['"]\s*\)/g) || [];
        for (const match of requireMatches) {
            const requirePath = match.match(/['"](.*?)['"]/)[1];
            references.push({
                type: 'require',
                path: requirePath,
                line: this.getLineNumberOfMatch(content, match)
            });
        }
        
        return references;
    }

    /**
     * 检测文件变更
     */
    async detectChanges() {
        console.log('🔄 检测文件变更...');
        
        const cutoffTime = new Date(Date.now() - (this.options.lookbackDays * 24 * 60 * 60 * 1000));
        const changes = {
            added: [],
            modified: [],
            deleted: []
        };

        // 检查前端文件
        await this.checkDirectoryChanges('./src', cutoffTime, changes);
        
        // 检查后端文件
        await this.checkDirectoryChanges('./server', cutoffTime, changes);

        this.changeLog = changes;
        console.log(`📊 检测到变更: 新增${changes.added.length}个, 修改${changes.modified.length}个`);

        return changes;
    }

    /**
     * 检查目录中的文件变更
     */
    async checkDirectoryChanges(dirPath, cutoffTime, changes) {
        if (!fs.existsSync(dirPath)) return;

        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const stats = fs.statSync(fullPath);
            
            if (stats.isDirectory()) {
                if (this.shouldScanDirectory(item)) {
                    await this.checkDirectoryChanges(fullPath, cutoffTime, changes);
                }
            } else {
                if (this.shouldProcessFile(item) && stats.mtime > cutoffTime) {
                    const fileInfo = await this.getFileMetadata(fullPath, stats);
                    changes.modified.push(fileInfo);
                }
            }
        }
    }

    /**
     * 生成文档
     */
    async generateDocuments(structure, changes) {
        console.log('📝 生成文档...');
        
        // 生成项目结构文档
        await this.generateStructureDoc(structure);
        
        // 生成架构文档
        await this.generateArchitectureDocs(structure);
        
        // 根据变更更新相关文档
        await this.updateChangedDocuments(changes);
    }

    /**
     * 生成项目结构文档
     */
    async generateStructureDoc(structure) {
        const outputPath = path.join(this.options.wikiDir, '项目目录结构', '项目目录结构.md');
        this.ensureDirectory(path.dirname(outputPath));
        
        let content = `# 项目目录结构\n\n`;
        
        // 添加引用标签
        content += `<cite>\n`;
        content += `**本文档中引用的文件**  \n`;
        content += `- [package.json](file://package.json)\n`;
        content += `- [quasar.config.ts](file://quasar.config.ts)\n`;
        content += `</cite>\n\n`;
        
        // 添加目录
        content += `## 目录\n\n`;
        content += `1. [前端目录结构](#前端目录结构)\n`;
        content += `2. [后端目录结构](#后端目录结构)\n`;
        content += `3. [配置文件说明](#配置文件说明)\n\n`;
        
        // 添加前端结构
        content += `## 前端目录结构\n\n`;
        content += `前端代码位于 \`src/\` 目录下，采用 Quasar 框架构建。\n\n`;
        content += await this.formatDirectoryStructure(structure.frontend);
        
        // 添加后端结构
        content += `## 后端目录结构\n\n`;
        content += `后端代码位于 \`server/\` 目录，采用 Node.js + Express 构建。\n\n`;
        content += await this.formatDirectoryStructure(structure.backend);
        
        // 保存文件
        fs.writeFileSync(outputPath, content, 'utf8');
        console.log(`✅ 生成项目结构文档: ${outputPath}`);
    }

    /**
     * 格式化目录结构为markdown
     */
    async formatDirectoryStructure(dirInfo) {
        if (dirInfo.error) return `*${dirInfo.error}*\n\n`;
        
        let content = '';
        
        // 添加目录树图
        content += `\`\`\`mermaid\n`;
        content += `graph TD\n`;
        
        const addNodes = (dir, parentId = 'ROOT') => {
            for (const file of dir.files.slice(0, 5)) { // 限制显示数量
                content += `    ${parentId} --> ${file.name.replace(/\./g, '_')}_${Math.random().toString(36).substr(2, 5)}["${file.name}"]\n`;
            }
            for (const subdir of dir.directories) {
                const nodeId = subdir.name.replace(/\./g, '_') + '_' + Math.random().toString(36).substr(2, 5);
                content += `    ${parentId} --> ${nodeId}["${subdir.name}/"]\n`;
                addNodes(subdir, nodeId);
            }
        };
        
        addNodes(dirInfo, 'PROJECT');
        content += `\`\`\`\n\n`;
        
        // 添加统计信息
        content += `**文件统计:**\n`;
        content += `- 总文件数: ${dirInfo.stats.totalFiles}\n`;
        content += `- 总目录数: ${dirInfo.stats.totalDirs}\n`;
        content += `- 代码文件: ${dirInfo.stats.codeFiles}\n\n`;
        
        return content;
    }

    /**
     * 生成架构文档
     */
    async generateArchitectureDocs(structure) {
        // 生成前端架构文档
        await this.generateFrontendArchitecture(structure.frontend);
        
        // 生成后端架构文档
        await this.generateBackendArchitecture(structure.backend);
    }

    /**
     * 生成前端架构文档
     */
    async generateFrontendArchitecture(frontend) {
        const outputPath = path.join(this.options.wikiDir, '前端架构', '前端架构.md');
        this.ensureDirectory(path.dirname(outputPath));
        
        let content = `# 前端架构\n\n`;
        content += `<cite>\n`;
        content += `**本文档引用的文件**\n`;
        content += `- [main.js](file://src/main.js)\n`;
        content += `- [App.vue](file://src/App.vue)\n`;
        content += `- [routes.ts](file://src/router/routes.ts)\n`;
        content += `</cite>\n\n`;
        
        content += `## 目录\n\n`;
        content += `1. [技术栈](#技术栈)\n`;
        content += `2. [目录结构](#目录结构)\n`;
        content += `3. [核心组件](#核心组件)\n\n`;
        
        content += `## 技术栈\n\n`;
        content += `- **框架**: Vue 3 + TypeScript\n`;
        content += `- **UI库**: Quasar Framework\n`;
        content += `- **状态管理**: Pinia\n`;
        content += `- **路由**: Vue Router 4\n\n`;
        
        content += `## 目录结构\n\n`;
        content += await this.formatDirectoryStructure(frontend);
        
        content += `## 核心组件\n\n`;
        content += `### 主要页面组件\n`;
        const pageFiles = frontend.files.filter(f => f.name.endsWith('Page.vue'));
        for (const file of pageFiles.slice(0, 5)) {
            content += `- [${file.name}](file://${file.path})\n`;
        }
        content += `\n`;
        
        fs.writeFileSync(outputPath, content, 'utf8');
        console.log(`✅ 生成前端架构文档: ${outputPath}`);
    }

    /**
     * 生成后端架构文档
     */
    async generateBackendArchitecture(backend) {
        const outputPath = path.join(this.options.wikiDir, '后端架构', '后端架构.md');
        this.ensureDirectory(path.dirname(outputPath));
        
        let content = `# 后端架构\n\n`;
        content += `<cite>\n`;
        content += `**本文档引用的文件**\n`;
        content += `- [index.js](file://server/index.js)\n`;
        content += `- [database.js](file://server/config/database.js)\n`;
        content += `</cite>\n\n`;
        
        content += `## 技术栈\n\n`;
        content += `- **运行时**: Node.js\n`;
        content += `- **框架**: Express.js\n`;
        content += `- **ORM**: Sequelize\n`;
        content += `- **数据库**: MySQL\n\n`;
        
        content += `## 目录结构\n\n`;
        content += await this.formatDirectoryStructure(backend);
        
        fs.writeFileSync(outputPath, content, 'utf8');
        console.log(`✅ 生成后端架构文档: ${outputPath}`);
    }

    /**
     * 更新变更文档
     */
    async updateChangedDocuments(changes) {
        if (changes.modified.length === 0 && changes.added.length === 0) {
            return;
        }
        
        console.log('🔄 更新变更文档...');
        
        // 根据变更类型更新对应文档
        for (const file of changes.modified) {
            await this.updateDocumentForFile(file);
        }
    }

    /**
     * 为特定文件更新文档
     */
    async updateDocumentForFile(fileInfo) {
        // 简化的更新逻辑 - 实际应用中需要更复杂的匹配规则
        const docPath = this.getDocumentPathForFile(fileInfo);
        if (docPath && fs.existsSync(docPath)) {
            const content = fs.readFileSync(docPath, 'utf8');
            const updatedContent = this.incrementalUpdate(content, fileInfo);
            fs.writeFileSync(docPath, updatedContent, 'utf8');
            console.log(`✅ 更新文档: ${docPath}`);
        }
    }

    /**
     * 增量更新文档内容
     */
    incrementalUpdate(content, fileInfo) {
        // 这里应该实现更智能的增量更新逻辑
        // 目前只是简单的追加变更信息
        
        const timestamp = new Date().toISOString();
        const updateSection = `\n<!-- 自动更新: ${timestamp} -->\n`;
        const fileInfoSection = `文件 \`${fileInfo.name}\` 于 ${fileInfo.modified.toLocaleString()} 被修改\n`;
        
        return content + updateSection + fileInfoSection;
    }

    // 辅助方法
    shouldScanDirectory(name) {
        const excludeDirs = ['node_modules', '.git', 'dist', 'build', '.qoder'];
        return !excludeDirs.includes(name);
    }

    shouldProcessFile(name) {
        const includeExtensions = ['.js', '.ts', '.vue', '.json', '.md'];
        const ext = path.extname(name).toLowerCase();
        return includeExtensions.includes(ext);
    }

    getFileType(extension) {
        const typeMap = {
            '.js': 'JavaScript',
            '.ts': 'TypeScript',
            '.vue': 'Vue Component',
            '.json': 'JSON Config',
            '.md': 'Markdown'
        };
        return typeMap[extension] || 'Unknown';
    }

    calculateStats(dirInfo) {
        let totalFiles = dirInfo.files.length;
        let totalDirs = dirInfo.directories.length;
        let codeFiles = dirInfo.files.filter(f => 
            ['.js', '.ts', '.vue'].includes(f.extension)
        ).length;

        for (const subdir of dirInfo.directories) {
            const subStats = this.calculateStats(subdir);
            totalFiles += subStats.totalFiles;
            totalDirs += subStats.totalDirs;
            codeFiles += subStats.codeFiles;
        }

        return { totalFiles, totalDirs, codeFiles };
    }

    getLineNumberOfMatch(content, match) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(match)) {
                return i + 1;
            }
        }
        return 0;
    }

    getDocumentPathForFile(fileInfo) {
        // 简单的文件到文档映射逻辑
        if (fileInfo.path.includes('routes')) {
            return path.join(this.options.wikiDir, 'API参考', 'API参考.md');
        }
        if (fileInfo.path.includes('models')) {
            return path.join(this.options.wikiDir, '数据库设计', '数据库设计.md');
        }
        return null;
    }

    ensureDirectory(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    printSummary() {
        console.log('\n📋 生成完成!');
        console.log(`总变更文件: ${this.changeLog.added.length + this.changeLog.modified.length}`);
        console.log(`新增文件: ${this.changeLog.added.length}`);
        console.log(`修改文件: ${this.changeLog.modified.length}`);
    }
}

// 导出供其他模块使用
module.exports = WikiGenerator;

// 如果直接运行此脚本
if (require.main === module) {
    const generator = new WikiGenerator();
    generator.generate().catch(console.error);
}
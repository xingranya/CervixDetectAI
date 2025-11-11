<template>
  <q-page class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <div class="text-h5 q-mb-md">AI模型</div>
        <p>监控和管理用于宫颈癌检测的AI模型。</p>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-lg-4 col-md-6 col-xs-12">
        <q-card flat bordered class="text-center">
          <q-card-section class="bg-primary text-white">
            <q-icon name="smart_toy" size="3rem" />
          </q-card-section>
          <q-card-section>
            <div class="text-h6">CervixDetectAI v2.1</div>
            <div class="text-caption text-grey">当前模型</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="row">
              <div class="col-6 text-center">
                <div class="text-bold">95.2%</div>
                <div class="text-caption text-grey">准确率</div>
              </div>
              <div class="col-6 text-center">
                <div class="text-bold">92.1%</div>
                <div class="text-caption text-grey">敏感性</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-lg-4 col-md-6 col-xs-12">
        <q-card flat bordered class="text-center">
          <q-card-section class="bg-secondary text-white">
            <q-icon name="memory" size="3rem" />
          </q-card-section>
          <q-card-section>
            <div class="text-h6">性能</div>
            <div class="text-caption text-grey">资源利用</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="row">
              <div class="col-6 text-center">
                <div class="text-bold">42ms</div>
                <div class="text-caption text-grey">平均推理时间</div>
              </div>
              <div class="col-6 text-center">
                <div class="text-bold">128MB</div>
                <div class="text-caption text-grey">内存使用</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-lg-4 col-md-6 col-xs-12">
        <q-card flat bordered class="text-center">
          <q-card-section class="bg-accent text-white">
            <q-icon name="trending_up" size="3rem" />
          </q-card-section>
          <q-card-section>
            <div class="text-h6">更新</div>
            <div class="text-caption text-grey">模型改进</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="text-bold">最新版本: v2.1.3</div>
            <q-btn 
              color="primary" 
              label="检查更新" 
              class="q-mt-md"
              size="sm"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card flat bordered class="q-mt-md">
      <q-card-section>
        <div class="text-h6">模型信息</div>
      </q-card-section>
      <q-card-section>
        <p>
          CervixDetectAI模型使用专为宫颈细胞学分析优化的深度学习架构。
          它已在来自多个临床站点的超过10万个带注释的宫颈图像上进行了训练。
        </p>
        
        <div class="text-h6 q-mt-md">技术规格</div>
        <ul class="q-mt-sm">
          <li><strong>架构:</strong> 以EfficientNet为骨干的自定义CNN</li>
          <li><strong>输入:</strong> 高分辨率宫颈图像 (1024x1024像素)</li>
          <li><strong>输出:</strong> 分类 (正常, ASC-US, LSIL, HSIL, 癌症), 生物标志物检测, 异常区域定位</li>
          <li><strong>训练数据:</strong> 10万个+带注释的图像</li>
          <li><strong>验证准确率:</strong> 95.2%</li>
          <li><strong>监管状态:</strong> FDA注册, CE认证</li>
        </ul>
      </q-card-section>
    </q-card>

    <q-card flat bordered class="q-mt-md">
      <q-card-section>
        <div class="text-h6">模型性能指标</div>
      </q-card-section>
      <q-card-section>
        <div class="row">
          <div class="col-md-6 col-xs-12 q-pr-md">
            <q-table
              title="分类性能"
              :rows="performanceData"
              :columns="performanceColumns"
              hide-bottom
              flat
            />
          </div>
          <div class="col-md-6 col-xs-12">
            <q-card flat bordered>
              <q-card-section>
                <div class="text-subtitle1">混淆矩阵 (示例)</div>
                <div class="flex flex-center q-mt-md">
                  <q-icon name="table_chart" size="10rem" color="grey" />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
// Performance data for the table
const performanceData = [
  { category: '正常', precision: '96.2%', recall: '94.8%', f1: '95.5%' },
  { category: 'ASC-US', precision: '88.5%', recall: '91.2%', f1: '89.8%' },
  { category: 'LSIL', precision: '92.1%', recall: '89.7%', f1: '90.9%' },
  { category: 'HSIL', precision: '94.3%', recall: '96.1%', f1: '95.2%' },
  { category: '癌症', precision: '97.8%', recall: '95.5%', f1: '96.6%' }
];

// Performance table columns
const performanceColumns = [
  { name: 'category', label: '类别', field: 'category', align: 'left' as const },
  { name: 'precision', label: '精确率', field: 'precision', align: 'center' as const },
  { name: 'recall', label: '召回率', field: 'recall', align: 'center' as const },
  { name: 'f1', label: 'F1分数', field: 'f1', align: 'center' as const }
];
</script>
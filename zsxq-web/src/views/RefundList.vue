<template>
  <div class="page-container">
    <!-- 返回按钮 + 标题 -->
    <div class="header">
      <el-button :icon="ArrowLeft" @click="goBack">返回列表</el-button>
      <h1 class="page-title">{{ campTitle }}</h1>
    </div>

    <!-- 参数设置区域 -->
    <el-card class="setting-card">
      <template #header>
        <div class="card-header">
          <span>退款名单生成</span>
        </div>
      </template>

      <div class="setting-form">
        <el-form :model="form" label-width="120px">
          <el-form-item label="完成要求天数">
            <el-input-number
              v-model="form.requiredDays"
              :min="1"
              :max="totalDays"
              :step="1"
            />
            <span class="hint">训练营共 {{ totalDays }} 天</span>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              :icon="Document"
              @click="generateList"
              :loading="loading"
            >
              生成退款名单
            </el-button>
            <el-button
              type="success"
              :icon="Download"
              @click="exportText"
              :disabled="!refundList.length"
            >
              导出文本
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 统计信息 -->
    <el-row :gutter="20" class="stats-row" v-if="statistics">
      <el-col :span="6">
        <el-statistic title="总人数" :value="statistics.total_count">
          <template #suffix>人</template>
        </el-statistic>
      </el-col>
      <el-col :span="6">
        <el-statistic title="合格人数" :value="statistics.qualified_count">
          <template #suffix>人</template>
        </el-statistic>
      </el-col>
      <el-col :span="6">
        <el-statistic title="不合格人数" :value="statistics.unqualified_count">
          <template #suffix>人</template>
        </el-statistic>
      </el-col>
      <el-col :span="6">
        <el-statistic title="合格率" :value="statistics.qualified_rate" :precision="2">
          <template #suffix>%</template>
        </el-statistic>
      </el-col>
    </el-row>

    <!-- 退款名单表格 -->
    <el-table
      :data="refundList"
      v-loading="loading"
      stripe
      border
      style="width: 100%; margin-top: 20px"
      v-if="refundList.length > 0"
    >
      <el-table-column type="index" label="序号" width="60" align="center" />

      <el-table-column prop="planet_nickname" label="星球昵称" min-width="150" />

      <el-table-column prop="planet_user_id" label="星球ID" width="150" align="center" />

      <el-table-column prop="checkined_days" label="打卡天数" width="100" align="center">
        <template #default="{ row }">
          {{ row.checkined_days }} / {{ row.required_days }}
        </template>
      </el-table-column>

      <el-table-column prop="is_qualified" label="是否合格" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.is_qualified ? 'success' : 'danger'">
            {{ row.is_qualified ? '合格' : '不合格' }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <!-- 空状态 -->
    <el-empty
      v-if="!loading && refundList.length === 0"
      description="点击"生成退款名单"按钮开始"
    />

    <!-- 合格名单(文本格式) -->
    <el-card class="names-card" v-if="statistics && statistics.qualified_names">
      <template #header>
        <div class="card-header">
          <span>合格名单(逗号分隔)</span>
        </div>
      </template>
      <div class="names-text">
        {{ statistics.qualified_names }}
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft, Document, Download } from '@element-plus/icons-vue';
import { generateRefundList } from '@/api/camps';

const route = useRoute();
const router = useRouter();

// 参数
const checkinId = computed(() => route.params.checkinId);
const campTitle = ref(route.query.title || '训练营');
const totalDays = ref(parseInt(route.query.totalDays || 7));

// 状态
const loading = ref(false);
const form = ref({
  requiredDays: totalDays.value // 默认要求完成所有天数
});
const refundList = ref([]);
const statistics = ref(null);

// 生成退款名单
const generateList = async () => {
  loading.value = true;
  try {
    const data = await generateRefundList(checkinId.value, {
      required_days: form.value.requiredDays
    });

    refundList.value = data.refund_list || [];
    statistics.value = data.statistics || null;

    ElMessage.success('生成成功');
  } catch (error) {
    ElMessage.error('生成失败:' + error.message);
  } finally {
    loading.value = false;
  }
};

// 导出文本
const exportText = () => {
  if (!statistics.value || !statistics.value.qualified_names) {
    ElMessage.warning('暂无数据可导出');
    return;
  }

  // 创建文本内容
  const textContent = `训练营:${campTitle.value}
完成要求:${form.value.requiredDays} 天
总人数:${statistics.value.total_count} 人
合格人数:${statistics.value.qualified_count} 人
不合格人数:${statistics.value.unqualified_count} 人
合格率:${statistics.value.qualified_rate}%

合格名单:
${statistics.value.qualified_names}
`;

  // 创建 Blob 对象
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // 创建下载链接
  const link = document.createElement('a');
  link.href = url;
  link.download = `退款名单_${campTitle.value}_${Date.now()}.txt`;
  link.click();

  // 释放 URL 对象
  URL.revokeObjectURL(url);

  ElMessage.success('导出成功');
};

// 返回列表
const goBack = () => {
  router.push({ name: 'CampList' });
};

// 页面加载时自动生成名单
onMounted(() => {
  if (checkinId.value) {
    generateList();
  }
});
</script>

<style scoped>
.page-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
  color: #303133;
}

.setting-card {
  margin-bottom: 20px;
}

.card-header {
  font-weight: 600;
  font-size: 16px;
}

.setting-form {
  padding: 10px 0;
}

.hint {
  margin-left: 12px;
  color: #909399;
  font-size: 14px;
}

.stats-row {
  margin-top: 20px;
}

.names-card {
  margin-top: 20px;
}

.names-text {
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  line-height: 1.8;
  color: #606266;
  word-break: break-all;
}
</style>

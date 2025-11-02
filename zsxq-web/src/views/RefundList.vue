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
            <el-input-number v-model="form.requiredDays" :min="1" :max="totalDays" :step="1" />
            <span class="hint">训练营共 {{ totalDays }} 天</span>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :icon="Document" @click="generateList" :loading="loading">
              生成退款名单
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 统计信息 -->
    <el-row :gutter="20" class="stats-row" v-if="statistics">
      <el-col :span="6">
        <el-statistic title="打卡总人数" :value="statistics.total_count">
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

      <el-table-column prop="planet_number" label="星球编号" width="120" align="center">
        <template #default="{ row }">
          <el-tag type="info" v-if="row.planet_number">{{ row.planet_number }}</el-tag>
          <span v-else style="color: #999;">-</span>
        </template>
      </el-table-column>

      <el-table-column prop="planet_nickname" label="星球昵称" min-width="150" />

      <el-table-column prop="checkined_days" label="打卡天数" width="100" align="center">
        <template #default="{ row }"> {{ row.checkined_days }} / {{ row.required_days }} </template>
      </el-table-column>

      <el-table-column prop="is_qualified" label="是否合格" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.is_qualified ? 'success' : 'danger'">
            {{ row.is_qualified ? '合格' : '不合格' }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <!-- 加载更多提示 -->
    <div v-if="refundList.length > 0" class="load-more-tip">
      <div v-if="loadingMore" class="loading-text">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      <div v-else-if="!pagination.hasMore" class="end-text">
        已加载全部数据（共 {{ statistics?.total_count || 0 }} 条）
      </div>
      <div v-else class="hint-text">
        向下滚动加载更多数据
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty v-if="!loading && refundList.length === 0" description="点击'生成退款名单'按钮开始" />

    <!-- 名单分栏(合格/不合格) -->
    <el-card class="names-card" v-if="statistics">
      <template #header>
        <div class="card-header">
          <span>打卡明细</span>
        </div>
      </template>
      <el-tabs v-model="activeTab" class="names-tabs">
        <el-tab-pane label="不合格名单" name="unqualified">
          <div class="names-text" v-if="unqualifiedNamesText">
            {{ unqualifiedNamesText }}
          </div>
          <el-empty v-else description="暂无不合格人员" :image-size="80" />
        </el-tab-pane>
        <el-tab-pane label="合格名单" name="qualified">
          <div class="names-text" v-if="statistics.qualified_names">
            {{ statistics.qualified_names }}
          </div>
          <el-empty v-else description="暂无合格人员" :image-size="80" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 导出操作栏 -->
    <div v-if="refundList.length > 0" class="export-bar">
      <el-button type="success" :icon="Picture" @click="handleDownloadImage">
        下载图片
      </el-button>
      <el-button type="primary" :icon="Document" @click="handleExportExcel">
        导出 Excel
      </el-button>
      <el-button :icon="Download" @click="exportText">
        导出文本
      </el-button>
      <el-button :icon="CopyDocument" @click="copyQualifiedList">
        一键复制名单
      </el-button>
    </div>

    <!-- 回到顶部按钮 -->
    <el-backtop :right="40" :bottom="40" :visibility-height="300">
      <div class="back-to-top-button">
        🚀
      </div>
    </el-backtop>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft, Document, Download, CopyDocument, Picture, Loading } from '@element-plus/icons-vue';
import { generateRefundList, getRefundListPaginated } from '@/api/camps';
import { exportExcel, downloadImage } from '@/utils/export';

const route = useRoute();
const router = useRouter();

// 参数
const checkinId = computed(() => route.params.checkinId);
const campTitle = ref(route.query.title || '训练营');
const totalDays = ref(parseInt(route.query.totalDays || 7));

// 状态
const loading = ref(false);
const loadingMore = ref(false);
const form = ref({
  requiredDays: 7 // 默认要求完成 7 天
});
const refundList = ref([]);
const allRefundData = ref([]); // 存储所有退款数据
const statistics = ref(null);
const activeTab = ref('unqualified'); // 默认显示不合格名单

// 分页状态
const pagination = ref({
  currentIndex: 0,
  pageSize: 20,
  hasMore: false
});

// 计算不合格人员名单文本(顿号分隔)
const unqualifiedNamesText = computed(() => {
  if (!allRefundData.value || allRefundData.value.length === 0) {
    return '';
  }

  const unqualifiedUsers = allRefundData.value.filter(user => !user.is_qualified);
  if (unqualifiedUsers.length === 0) {
    return '';
  }

  return unqualifiedUsers
    .map(user => user.planet_nickname)
    .join('、');
});

// 生成退款名单（首次加载）
const generateList = async () => {
  loading.value = true;
  refundList.value = []; // 清空已有数据
  allRefundData.value = []; // 清空完整数据
  pagination.value.currentIndex = 0; // 重置分页

  try {
    // 使用全量接口获取完整数据和统计信息
    const data = await generateRefundList(checkinId.value, {
      required_days: form.value.requiredDays
    });

    // 设置数据
    allRefundData.value = data.refund_list || [];
    statistics.value = data.statistics;

    // 只显示第一页数据
    refundList.value = allRefundData.value.slice(0, pagination.value.pageSize);

    // 设置分页状态
    if (allRefundData.value.length > pagination.value.pageSize) {
      pagination.value.hasMore = true;
      pagination.value.currentIndex = pagination.value.pageSize;
    } else {
      pagination.value.hasMore = false;
    }

    ElMessage.success('生成成功');

    // 添加滚动监听
    await nextTick();
    addScrollListener();
  } catch (error) {
    // 提取后端返回的错误信息
    const errorMsg = error.response?.data?.message || error.message || '生成失败';

    ElMessage({
      message: errorMsg,
      type: 'error',
      duration: 10000, // 显示 10 秒,确保用户看到
      showClose: true,
      dangerouslyUseHTMLString: false
    });
  } finally {
    loading.value = false;
  }
};

// 加载更多数据（从本地缓存加载，不调用API）
const loadMore = () => {
  if (!pagination.value.hasMore || loadingMore.value) {
    return;
  }

  loadingMore.value = true;

  // 使用 setTimeout 模拟异步加载，优化用户体验
  setTimeout(() => {
    try {
      const start = pagination.value.currentIndex;
      const end = start + pagination.value.pageSize;

      // 从缓存的完整数据中截取下一页
      const nextPageData = allRefundData.value.slice(start, end);
      refundList.value.push(...nextPageData);

      // 更新分页状态
      pagination.value.currentIndex = end;
      pagination.value.hasMore = end < allRefundData.value.length;
    } catch (error) {
      console.error('加载更多失败:', error);
    } finally {
      loadingMore.value = false;
    }
  }, 300); // 300ms延迟，让用户看到加载效果
};

// 滚动监听
let scrollListener = null;

const addScrollListener = () => {
  removeScrollListener(); // 先移除旧的监听器

  scrollListener = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // 当滚动到距离底部 200px 时触发加载
    if (scrollTop + windowHeight >= documentHeight - 200) {
      loadMore();
    }
  };

  window.addEventListener('scroll', scrollListener);
};

const removeScrollListener = () => {
  if (scrollListener) {
    window.removeEventListener('scroll', scrollListener);
    scrollListener = null;
  }
};

// 一键复制名单（根据当前 Tab 复制对应名单）
const copyQualifiedList = async () => {
  if (!allRefundData.value || allRefundData.value.length === 0) {
    ElMessage.warning('暂无数据可复制');
    return;
  }

  // 从完整数据中筛选目标人员
  const isQualified = activeTab.value === 'qualified'; // 判断当前 Tab
  const targetUsers = allRefundData.value.filter(user => user.is_qualified === isQualified);

  if (targetUsers.length === 0) {
    ElMessage.warning(`暂无${isQualified ? '合格' : '不合格'}人员`);
    return;
  }

  // 生成格式：姓名(编号),姓名2(编号2)
  const copyText = targetUsers
    .map(user => `${user.planet_nickname}(${user.planet_number || user.planet_user_id})`)
    .join(',');

  try {
    // 使用 Clipboard API 复制到剪贴板
    await navigator.clipboard.writeText(copyText);
    ElMessage.success(`已复制 ${targetUsers.length} 位${isQualified ? '合格' : '不合格'}人员名单`);
  } catch (error) {
    // 降级方案：使用传统方法复制
    const textarea = document.createElement('textarea');
    textarea.value = copyText;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      ElMessage.success(`已复制 ${targetUsers.length} 位${isQualified ? '合格' : '不合格'}人员名单`);
    } catch (err) {
      ElMessage.error('复制失败，请手动复制');
      console.error('复制失败:', err);
    } finally {
      document.body.removeChild(textarea);
    }
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
打卡总人数:${statistics.value.total_count} 人
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

// 导出 Excel
const handleExportExcel = () => {
  if (!refundList.value.length) {
    ElMessage.warning('暂无数据可导出');
    return;
  }

  exportExcel(
    refundList.value,
    {
      title: campTitle.value,
      totalDays: totalDays.value
    },
    statistics.value,
    form.value.requiredDays
  );
};

// 下载图片
const handleDownloadImage = () => {
  if (!refundList.value.length) {
    ElMessage.warning('暂无数据可导出');
    return;
  }

  downloadImage('.page-container', {
    title: campTitle.value
  });
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

// 组件卸载时移除滚动监听
onUnmounted(() => {
  removeScrollListener();
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

.names-tabs {
  margin-top: 12px;
}

.names-text {
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  line-height: 1.8;
  color: #606266;
  word-break: break-all;
  min-height: 100px;
}

.load-more-tip {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 14px;
}

.load-more-tip .loading-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #409eff;
}

.load-more-tip .end-text {
  color: #67c23a;
  font-weight: 500;
}

.load-more-tip .hint-text {
  color: #909399;
}

.export-bar {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .page-container {
    padding: 16px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .page-title {
    font-size: 22px;
  }

  .stats-row .el-col {
    margin-bottom: 12px;
  }

  .setting-form .el-form {
    padding: 0;
  }

  .setting-form .el-form-item {
    margin-bottom: 16px;
  }

  .setting-form .el-button {
    width: 100%;
    margin-bottom: 8px;
  }

  .hint {
    display: block;
    margin-left: 0;
    margin-top: 8px;
  }

  .export-bar {
    flex-direction: column;
  }

  .export-bar .el-button {
    width: 100%;
  }
}

.back-to-top-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.back-to-top-button:hover {
  transform: translateY(-5px) scale(1.1);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.6);
}
</style>

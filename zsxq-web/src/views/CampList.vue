<template>
  <div class="page-container">
    <h1 class="page-title">训练营退款系统 - v0</h1>

    <!-- 筛选区域 -->
    <div class="filter-bar">
      <el-select v-model="scope" placeholder="请选择状态" style="width: 200px" @change="loadCamps">
        <el-option label="进行中" value="ongoing" />
        <el-option label="已结束" value="over" />
        <el-option label="已关闭" value="closed" />
      </el-select>

      <el-button type="primary" :icon="Refresh" @click="loadCamps" :loading="loading">
        刷新列表
      </el-button>
    </div>

    <!-- 训练营列表表格 -->
    <el-table :data="camps" v-loading="loading" stripe border style="width: 100%; margin-top: 20px">
      <el-table-column prop="title" label="训练营名称" min-width="200" />

      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="checkin_days" label="打卡天数" width="120" align="center">
        <template #default="{ row }"> {{ row.checkin_days }} 天 </template>
      </el-table-column>

      <el-table-column prop="joined_count" label="参与人数" width="120" align="center">
        <template #default="{ row }"> {{ row.joined_count }} 人 </template>
      </el-table-column>

      <el-table-column prop="expiration_time" label="结束时间" width="180" align="center">
        <template #default="{ row }">
          {{ formatDate(row.expiration_time) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="150" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            @click="goToRefundList(row)"
            v-if="row.status === 'over' || row.status === 'closed'"
          >
            生成名单
          </el-button>
          <el-button type="info" size="small" disabled v-else> 进行中 </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 空状态 -->
    <el-empty v-if="!loading && camps.length === 0" description="暂无训练营数据" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import { getCamps } from '@/api/camps';

const router = useRouter();

// 状态
const loading = ref(false);
const scope = ref('over'); // 默认显示已结束
const camps = ref([]);

// 加载训练营列表
const loadCamps = async () => {
  loading.value = true;
  try {
    const data = await getCamps({ scope: scope.value });
    // data 本身就是训练营数组 (拦截器已经返回了 res.data)
    camps.value = data || [];
    ElMessage.success(`加载成功,共 ${camps.value.length} 个训练营`);
  } catch (error) {
    ElMessage.error('加载失败:' + error.message);
  } finally {
    loading.value = false;
  }
};

// 跳转到退款名单页面
const goToRefundList = (camp) => {
  router.push({
    name: 'RefundList',
    params: { checkinId: camp.checkin_id },
    query: {
      title: camp.title,
      totalDays: camp.checkin_days
    }
  });
};

// 获取状态类型(Element Plus Tag)
const getStatusType = (status) => {
  const statusMap = {
    ongoing: 'success',
    over: 'warning',
    closed: 'info'
  };
  return statusMap[status] || 'info';
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    ongoing: '进行中',
    over: '已结束',
    closed: '已关闭'
  };
  return statusMap[status] || '未知';
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 页面加载时获取数据
onMounted(() => {
  loadCamps();
});
</script>

<style scoped>
.page-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 24px;
  color: #303133;
}

.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .page-container {
    padding: 16px;
  }

  .page-title {
    font-size: 22px;
    margin-bottom: 16px;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-bar .el-select,
  .filter-bar .el-button {
    width: 100%;
  }
}
</style>

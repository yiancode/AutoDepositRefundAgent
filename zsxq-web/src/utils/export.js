import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'
import { ElMessage } from 'element-plus'

/**
 * 导出 Excel
 * @param {Array} refundList - 退款名单
 * @param {Object} campInfo - 训练营信息
 * @param {Object} statistics - 统计信息
 * @param {number} requiredDays - 完成要求天数
 */
export function exportExcel(refundList, campInfo, statistics, requiredDays) {
  try {
    // 构建 Excel 数据
    const data = [
      [campInfo.title], // 使用训练营名称作为标题
      [],
      ['训练营名称', campInfo.title],
      ['打卡总天数', campInfo.totalDays],
      ['完成要求', `${requiredDays}天`],
      ['总人数', statistics.total_count],
      ['合格人数', statistics.qualified_count],
      ['不合格人数', statistics.unqualified_count],
      ['合格率', `${statistics.qualified_rate}%`],
      [],
      ['完成打卡人员名单'],
      [statistics.qualified_names],
      [],
      ['序号', '星球昵称', '星球编号', '打卡天数', '是否合格']
    ]

    // 添加详细名单
    refundList.forEach((item, index) => {
      data.push([
        index + 1,
        item.planet_nickname,
        // 优先使用 planet_number，如果没有则使用 planet_user_id
        item.planet_number || `'${item.planet_user_id}`,
        item.checkined_days,
        item.is_qualified ? '合格' : '不合格'
      ])
    })

    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(data)

    // 设置列宽
    ws['!cols'] = [
      { wch: 8 }, // 序号
      { wch: 20 }, // 星球昵称
      { wch: 20 }, // 星球ID
      { wch: 12 }, // 打卡天数
      { wch: 12 } // 是否合格
    ]

    // 创建工作簿
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '退款名单')

    // 生成文件名
    const date = new Date().toISOString().split('T')[0]
    const filename = `退款名单-${campInfo.title}-${date}.xlsx`

    // 导出文件
    XLSX.writeFile(wb, filename)

    ElMessage.success('Excel 导出成功')
  } catch (error) {
    console.error('导出 Excel 失败:', error)
    ElMessage.error('导出 Excel 失败')
  }
}

/**
 * 下载页面截图
 * @param {string} selector - DOM 选择器
 * @param {Object} campInfo - 训练营信息
 */
export async function downloadImage(selector, campInfo) {
  try {
    ElMessage.info('正在生成图片，请稍候...')

    const element = document.querySelector(selector)
    if (!element) {
      throw new Error('未找到目标元素')
    }

    // 生成 Canvas
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // 提高清晰度
      useCORS: true,
      logging: false,
      windowWidth: element.scrollWidth, // 使用元素实际宽度
      windowHeight: element.scrollHeight // 使用元素实际高度
    })

    // 转换为 Blob
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const date = new Date().toISOString().split('T')[0]
      link.download = `退款名单-${campInfo.title}-${date}.png`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)

      ElMessage.success('图片下载成功')
    })
  } catch (error) {
    console.error('下载图片失败:', error)
    ElMessage.error('下载图片失败')
  }
}

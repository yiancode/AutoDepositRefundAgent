# Story 6.2: 报表数据导出

**Status**: ready-for-dev

---

## Story

**作为**管理员，
**我希望**能够将报表数据导出为Excel文件，
**以便于**进行离线分析和存档。

---

## 验收标准

### AC-1: 导出训练营报表
```gherkin
Feature: 导出训练营报表
  Scenario: 导出当前筛选数据
    Given 管理员在报表页面
    And 已选择时间范围
    When 点击 "导出Excel"
    Then GET /api/admin/stats/export?startDate=&endDate=
    And 下载 Excel 文件
    And 文件名: 训练营报表_{日期}.xlsx

  Scenario: 导出完整数据
    Given 不选择时间范围
    When 点击 "导出Excel"
    Then 导出所有历史数据
```

### AC-2: Excel 文件内容
```gherkin
Feature: Excel文件内容
  Scenario: 包含概览Sheet
    Given 导出成功
    Then Excel 第一个 Sheet 为 "概览"
    And 包含:
      | 指标 | 值 |
      | 训练营总数 | {totalCamps} |
      | 参与会员总数 | {totalMembers} |
      | 押金收入总额 | {totalDeposit} |
      | 退款总额 | {totalRefund} |
      | 净收入 | {netIncome} |

  Scenario: 包含明细Sheet
    Given 导出成功
    Then Excel 第二个 Sheet 为 "训练营明细"
    And 包含表头:
      | 列名 |
      | 训练营名称 |
      | 报名人数 |
      | 完成率(%) |
      | 押金收入 |
      | 退款金额 |
      | 净收入 |
    And 包含所有训练营数据行
```

### AC-3: 导出格式选择
```gherkin
Feature: 导出格式
  Scenario: 导出 Excel 格式
    Given 点击导出
    When 选择 "Excel (.xlsx)"
    Then 下载 xlsx 文件

  Scenario: 导出 CSV 格式
    Given 点击导出
    When 选择 "CSV"
    Then 下载 csv 文件
    And 编码为 UTF-8 with BOM
```

### AC-4: 导出状态提示
```gherkin
Feature: 导出状态
  Scenario: 导出中状态
    Given 点击导出按钮
    Then 按钮显示加载状态
    And 显示 "正在生成报表..."

  Scenario: 导出成功
    Given 文件生成完成
    Then 浏览器自动下载文件
    And 显示成功提示 "导出成功"

  Scenario: 导出失败
    Given 导出过程出错
    Then 显示错误提示
    And 可重试导出
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - 导出接口** (AC: #1, #2)
  - [ ] 1.1 实现 `GET /api/admin/stats/export`
  - [ ] 1.2 查询数据并聚合
  - [ ] 1.3 返回文件流

- [ ] **Task 2: 后端 - Excel 生成** (AC: #2)
  - [ ] 2.1 创建 `ExcelExportUtil.java`
  - [ ] 2.2 生成概览 Sheet
  - [ ] 2.3 生成明细 Sheet
  - [ ] 2.4 样式美化 (表头加粗、金额格式)

- [ ] **Task 3: 后端 - CSV 导出** (AC: #3)
  - [ ] 3.1 实现 CSV 格式导出
  - [ ] 3.2 UTF-8 BOM 编码处理

- [ ] **Task 4: 前端 - 导出功能** (AC: #1, #3, #4)
  - [ ] 4.1 添加导出按钮
  - [ ] 4.2 实现格式选择下拉
  - [ ] 4.3 实现文件下载
  - [ ] 4.4 加载状态和提示

- [ ] **Task 5: 测试** (AC: #全部)
  - [ ] 5.1 测试 Excel 内容正确性
  - [ ] 5.2 测试 CSV 内容正确性
  - [ ] 5.3 测试大数据量导出

---

## Dev Notes

### 业务流程概述

```
管理员点击 "导出Excel"
     ↓
前端发起请求:
└── GET /api/admin/stats/export?format=xlsx&startDate=&endDate=
     ↓
后端处理:
├── 查询概览数据
├── 查询明细数据
├── 生成 Excel (Apache POI)
└── 返回文件流
     ↓
前端处理:
├── 接收 Blob 数据
├── 创建下载链接
└── 触发下载
```

### 代码实现参考

#### StatsController.java - 导出接口

```java
/**
 * 导出报表
 */
@GetMapping("/export")
public void exportReport(
        @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
        @RequestParam(defaultValue = "xlsx") String format,
        HttpServletResponse response) throws IOException {

    String filename = "训练营报表_" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);

    if ("csv".equalsIgnoreCase(format)) {
        response.setContentType("text/csv;charset=UTF-8");
        response.setHeader("Content-Disposition",
            "attachment;filename=" + URLEncoder.encode(filename + ".csv", "UTF-8"));
        statsService.exportCsv(startDate, endDate, response.getOutputStream());
    } else {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition",
            "attachment;filename=" + URLEncoder.encode(filename + ".xlsx", "UTF-8"));
        statsService.exportExcel(startDate, endDate, response.getOutputStream());
    }
}
```

#### ExcelExportUtil.java

```java
@Component
public class ExcelExportUtil {

    /**
     * 生成报表 Excel
     */
    public void generateReportExcel(
            StatsOverviewVO overview,
            List<CampDetailStatsVO> details,
            OutputStream outputStream) throws IOException {

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            // 创建样式
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle moneyStyle = createMoneyStyle(workbook);

            // Sheet 1: 概览
            createOverviewSheet(workbook, overview, headerStyle, moneyStyle);

            // Sheet 2: 明细
            createDetailSheet(workbook, details, headerStyle, moneyStyle);

            workbook.write(outputStream);
        }
    }

    private void createOverviewSheet(XSSFWorkbook workbook, StatsOverviewVO overview,
                                     CellStyle headerStyle, CellStyle moneyStyle) {
        Sheet sheet = workbook.createSheet("概览");

        String[][] data = {
            {"指标", "值"},
            {"训练营总数", String.valueOf(overview.getTotalCamps())},
            {"参与会员总数", String.valueOf(overview.getTotalMembers())},
            {"押金收入总额", formatMoney(overview.getTotalDeposit())},
            {"退款总额", formatMoney(overview.getTotalRefund())},
            {"净收入", formatMoney(overview.getNetIncome())}
        };

        for (int i = 0; i < data.length; i++) {
            Row row = sheet.createRow(i);
            for (int j = 0; j < data[i].length; j++) {
                Cell cell = row.createCell(j);
                cell.setCellValue(data[i][j]);
                if (i == 0) {
                    cell.setCellStyle(headerStyle);
                }
            }
        }

        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
    }

    private void createDetailSheet(XSSFWorkbook workbook, List<CampDetailStatsVO> details,
                                   CellStyle headerStyle, CellStyle moneyStyle) {
        Sheet sheet = workbook.createSheet("训练营明细");

        // 表头
        String[] headers = {"训练营名称", "报名人数", "完成率(%)", "押金收入", "退款金额", "净收入"};
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // 数据行
        int rowNum = 1;
        for (CampDetailStatsVO detail : details) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(detail.getCampName());
            row.createCell(1).setCellValue(detail.getEnrollCount());
            row.createCell(2).setCellValue(detail.getCompletionRate().doubleValue());

            Cell depositCell = row.createCell(3);
            depositCell.setCellValue(detail.getDepositAmount().doubleValue());
            depositCell.setCellStyle(moneyStyle);

            Cell refundCell = row.createCell(4);
            refundCell.setCellValue(detail.getRefundAmount().doubleValue());
            refundCell.setCellStyle(moneyStyle);

            Cell netCell = row.createCell(5);
            netCell.setCellValue(detail.getNetIncome().doubleValue());
            netCell.setCellStyle(moneyStyle);
        }

        // 自动列宽
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private CellStyle createHeaderStyle(XSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private CellStyle createMoneyStyle(XSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0.00"));
        return style;
    }

    private String formatMoney(BigDecimal amount) {
        return amount == null ? "0.00" : String.format("%.2f", amount);
    }
}
```

#### 前端文件下载

```javascript
// api/stats.js
export const exportReport = (params) => {
  return request({
    url: '/api/admin/stats/export',
    method: 'get',
    params,
    responseType: 'blob'  // 重要: 指定响应类型为 blob
  })
}

// CampReport.vue
const handleExport = async (format) => {
  exporting.value = true
  try {
    const response = await exportReport({
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1],
      format
    })

    // 创建下载链接
    const blob = new Blob([response], {
      type: format === 'csv'
        ? 'text/csv;charset=utf-8'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `训练营报表_${dayjs().format('YYYYMMDD')}.${format}`
    link.click()
    window.URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败: ' + error.message)
  } finally {
    exporting.value = false
  }
}
```

### 依赖

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi-ooxml</artifactId>
    <version>5.2.3</version>
</dependency>
```

---

## 项目结构

### 后端新增文件

```
backend/src/main/java/com/camp/
└── util/
    └── ExcelExportUtil.java                    # 新增Excel导出工具
```

### 后端修改文件

```
backend/src/main/java/com/camp/
├── controller/
│   └── admin/
│       └── StatsController.java                # 修改添加导出接口
└── service/
    ├── StatsService.java                       # 修改添加导出方法
    └── impl/
        └── StatsServiceImpl.java               # 修改添加导出实现
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP06-S01 统计报表 | ready-for-dev | 报表数据接口 |

---

## Story Metadata

| 属性 | 值 |
|------|-----|
| Story 点数 | 2 |
| 优先级 | P2 |
| Epic | EP06 |
| 前置条件 | EP06-S01 完成 |
| 覆盖 FR | FR9.3 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |

package com.youlai.boot.system.model.dto;

import cn.idev.excel.annotation.ExcelProperty;
import cn.idev.excel.annotation.format.DateTimeFormat;
import cn.idev.excel.annotation.write.style.ColumnWidth;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户导出视图对象
 *
 * @author haoxr
 * @since 2022/4/11 8:46
 */

@Data
@ColumnWidth(20)
public class AlarmExportDTO {

    @ExcelProperty(value = "告警监狱")
    private String prisonName;

    @ExcelProperty(value = "告警设备ID")
    private String entireNo;

    @ExcelProperty(value = "告警设备名称")
    private String deviceName;

    @ExcelProperty(value = "告警内容")
    private String content;

    @ExcelProperty(value = "告警发生时间")
    @DateTimeFormat("yyyy-MM-dd HH:mm:ss")
    private LocalDateTime alarmTime;

    @ExcelProperty(value = "排查建议")
    private String suggestions;

//    @ExcelProperty(value = "处理状态（0：未处理，1：已处理）")
//    private Integer processingStatus;

    @ExcelProperty(value = "解决时间")
    @DateTimeFormat("yyyy-MM-dd HH:mm:ss")
    private LocalDateTime resolutionTime;

}

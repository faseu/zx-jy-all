package com.youlai.boot.system.controller;

import cn.idev.excel.EasyExcel;
import com.youlai.boot.common.annotation.Log;
import com.youlai.boot.common.annotation.OperLog;
import com.youlai.boot.common.enums.LogModuleEnum;
import com.youlai.boot.system.model.dto.AlarmExportDTO;
import com.youlai.boot.system.model.dto.UserExportDTO;
import com.youlai.boot.system.model.query.UserPageQuery;
import com.youlai.boot.system.service.TAlarmService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.youlai.boot.system.model.form.TAlarmForm;
import com.youlai.boot.system.model.query.TAlarmQuery;
import com.youlai.boot.system.model.vo.TAlarmVO;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.youlai.boot.core.web.PageResult;
import com.youlai.boot.core.web.Result;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * 告警前端控制层
 *
 * @author youlaitech
 * @since 2026-01-20 20:18
 */
@Tag(name = "17.告警接口")
@RestController
@RequestMapping("/api/v1/alarm")
@RequiredArgsConstructor
public class TAlarmController  {

    private final TAlarmService tAlarmService;

    @Operation(summary = "告警分页列表")
    @GetMapping("/page")
//    @PreAuthorize("@ss.hasPerm('system:alarm:query')")
    public PageResult<TAlarmVO> getTAlarmPage(TAlarmQuery queryParams ) {
        IPage<TAlarmVO> result = tAlarmService.getTAlarmPage(queryParams);
        return PageResult.success(result);
    }

    @Operation(summary = "新增告警")
    @PostMapping
//    @PreAuthorize("@ss.hasPerm('system:alarm:add')")
    public Result<Void> saveTAlarm(@RequestBody @Valid TAlarmForm formData ) {
        boolean result = tAlarmService.saveTAlarm(formData);
        return Result.judge(result);
    }

    @Operation(summary = "获取告警表单数据")
    @GetMapping("/{id}/form")
//    @PreAuthorize("@ss.hasPerm('system:alarm:edit')")
    public Result<TAlarmForm> getTAlarmForm(
        @Parameter(description = "告警ID") @PathVariable Long id
    ) {
        TAlarmForm formData = tAlarmService.getTAlarmFormData(id);
        return Result.success(formData);
    }

    @Operation(summary = "修改告警")
    @PutMapping(value = "/{id}")
    @OperLog(value="修改告警")
//    @PreAuthorize("@ss.hasPerm('system:alarm:edit')")
    public Result<Void> updateTAlarm(
            @Parameter(description = "告警ID") @PathVariable Long id,
            @RequestBody @Validated TAlarmForm formData
    ) {
        boolean result = tAlarmService.updateTAlarm(id, formData);
        return Result.judge(result);
    }

    @Operation(summary = "删除告警")
    @DeleteMapping("/{ids}")
    @OperLog(value="删除告警")
//    @PreAuthorize("@ss.hasPerm('system:alarm:delete')")
    public Result<Void> deleteTAlarms(
        @Parameter(description = "告警ID，多个以英文逗号(,)分割") @PathVariable String ids
    ) {
        boolean result = tAlarmService.deleteTAlarms(ids);
        return Result.judge(result);
    }

    @Operation(summary = "导出告警")
    @GetMapping("/export")
    @OperLog(value="导出告警")
//    @PreAuthorize("@ss.hasPerm('sys:alarm:export')")
    @Log(value = "导出告警", module = LogModuleEnum.OTHER)
    public void exportUsers(TAlarmQuery queryParams, HttpServletResponse response) throws IOException {
        String fileName = "告警记录.xlsx";
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=" + URLEncoder.encode(fileName, StandardCharsets.UTF_8));

        List<AlarmExportDTO> exportUserList = tAlarmService.listExportAlarms(queryParams);
        EasyExcel.write(response.getOutputStream(), AlarmExportDTO.class).sheet("告警记录")
                .doWrite(exportUserList);
    }

}

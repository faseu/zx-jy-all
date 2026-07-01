package com.youlai.boot.system.controller;

import com.youlai.boot.common.annotation.OperLog;
import com.youlai.boot.system.service.TFloorService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.youlai.boot.system.model.form.TFloorForm;
import com.youlai.boot.system.model.query.TFloorQuery;
import com.youlai.boot.system.model.vo.TFloorVO;
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

/**
 * 楼层前端控制层
 *
 * @author youlaitech
 * @since 2026-01-20 20:15
 */
@Tag(name = "15.楼层接口")
@RestController
@RequestMapping("/api/v1/floor")
@RequiredArgsConstructor
public class TFloorController  {

    private final TFloorService tFloorService;

    @Operation(summary = "楼层分页列表")
    @GetMapping("/page")
//    @PreAuthorize("@ss.hasPerm('system:floor:query')")
    public PageResult<TFloorVO> getTFloorPage(TFloorQuery queryParams ) {
        IPage<TFloorVO> result = tFloorService.getTFloorPage(queryParams);
        return PageResult.success(result);
    }

    @Operation(summary = "新增楼层")
    @PostMapping
    @OperLog(value ="新增楼层")
//    @PreAuthorize("@ss.hasPerm('system:floor:add')")
    public Result<Void> saveTFloor(@RequestBody @Valid TFloorForm formData ) {
        boolean result = tFloorService.saveTFloor(formData);
        return Result.judge(result);
    }

    @Operation(summary = "获取楼层表单数据")
    @GetMapping("/{id}/form")
//    @PreAuthorize("@ss.hasPerm('system:floor:edit')")
    public Result<TFloorForm> getTFloorForm(
        @Parameter(description = "楼层ID") @PathVariable Long id
    ) {
        TFloorForm formData = tFloorService.getTFloorFormData(id);
        return Result.success(formData);
    }

    @Operation(summary = "修改楼层")
    @PutMapping(value = "/{id}")
    @OperLog(value ="修改楼层")
//    @PreAuthorize("@ss.hasPerm('system:floor:edit')")
    public Result<Void> updateTFloor(
            @Parameter(description = "楼层ID") @PathVariable Long id,
            @RequestBody @Validated TFloorForm formData
    ) {
        boolean result = tFloorService.updateTFloor(id, formData);
        return Result.judge(result);
    }

    @Operation(summary = "删除楼层")
    @DeleteMapping("/{ids}")
    @OperLog(value ="删除楼层")
//    @PreAuthorize("@ss.hasPerm('system:floor:delete')")
    public Result<Void> deleteTFloors(
        @Parameter(description = "楼层ID，多个以英文逗号(,)分割") @PathVariable String ids
    ) {
        boolean result = tFloorService.deleteTFloors(ids);
        return Result.judge(result);
    }


    @Operation(summary = "添加楼层图纸")
    @PutMapping(value = "/updateTFloorDraw/{id}")
    @OperLog(value = "添加楼层图纸")
//    @PreAuthorize("@ss.hasPerm('system:floor:edit')")
    public Result<Void> updateTFloorDraw(
            @Parameter(description = "楼层ID") @PathVariable Long id,
            @Parameter(description = "图纸url") @RequestParam String filePath
    ) {
        boolean result = tFloorService.updateTFloorDraw(id, filePath);
        return Result.judge(result);
    }
}

package com.youlai.boot.system.controller;

import com.youlai.boot.common.annotation.OperLog;
import com.youlai.boot.system.model.vo.*;
import com.youlai.boot.system.service.TBuildingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.youlai.boot.system.model.form.TBuildingForm;
import com.youlai.boot.system.model.query.TBuildingQuery;
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

import java.util.List;

/**
 * 楼栋前端控制层
 *
 * @author youlaitech
 * @since 2026-01-20 20:15
 */
@Tag(name = "14.楼栋接口")
@RestController
@RequestMapping("/api/v1/building")
@RequiredArgsConstructor
public class TBuildingController  {

    private final TBuildingService tBuildingService;

    @Operation(summary = "楼详情统计")
    @GetMapping("/info/{id}")
//    @PreAuthorize("@ss.hasPerm('system:prison:query')")
    public Result<TBuildingInfoVO> getTBuildingInfo(
            @Parameter(description = "楼ID") @PathVariable Long id
    ) {
        TBuildingInfoVO info = tBuildingService.getTBuildingInfo(id);
        return Result.success(info);
    }

    @Operation(summary = "楼详情楼层列表")
    @GetMapping("/floor/{id}")
    public Result<List<TFloorDetailVO>> getFloorList(
            @Parameter(description ="楼ID") @PathVariable Long id
    ) {
        List<TFloorDetailVO> info = tBuildingService.getFloorList(id);
        return Result.success(info);
    }


    @Operation(summary = "楼栋分页列表")
    @GetMapping("/page")
//    @PreAuthorize("@ss.hasPerm('system:building:query')")
    public PageResult<TBuildingVO> getTBuildingPage(TBuildingQuery queryParams ) {
        IPage<TBuildingVO> result = tBuildingService.getTBuildingPage(queryParams);
        return PageResult.success(result);
    }

    @Operation(summary = "新增楼栋")
    @PostMapping
    @OperLog(value="新增楼栋")
//    @PreAuthorize("@新增楼栋ss.hasPerm('system:building:add')")
    public Result<Void> saveTBuilding(@RequestBody @Valid TBuildingForm formData ) {
        boolean result = tBuildingService.saveTBuilding(formData);
        return Result.judge(result);
    }

    @Operation(summary = "获取楼栋表单数据")
    @GetMapping("/{id}/form")
//    @PreAuthorize("@ss.hasPerm('system:building:edit')")
    public Result<TBuildingForm> getTBuildingForm(
        @Parameter(description = "楼栋ID") @PathVariable Long id
    ) {
        TBuildingForm formData = tBuildingService.getTBuildingFormData(id);
        return Result.success(formData);
    }

    @Operation(summary = "修改楼栋")
    @PutMapping(value = "/{id}")
    @OperLog(value="修改楼栋")
//    @PreAuthorize("@ss.hasPerm('system:building:edit')")
    public Result<Void> updateTBuilding(
            @Parameter(description = "楼栋ID") @PathVariable Long id,
            @RequestBody @Validated TBuildingForm formData
    ) {
        boolean result = tBuildingService.updateTBuilding(id, formData);
        return Result.judge(result);
    }

    @Operation(summary = "删除楼栋")
    @DeleteMapping("/{ids}")
    @OperLog(value="删除楼栋")
//    @PreAuthorize("@ss.hasPerm('system:building:delete')")
    public Result<Void> deleteTBuildings(
        @Parameter(description = "楼栋ID，多个以英文逗号(,)分割") @PathVariable String ids
    ) {
        boolean result = tBuildingService.deleteTBuildings(ids);
        return Result.judge(result);
    }
}

package com.youlai.boot.system.controller;

import com.alibaba.fastjson.JSONObject;
import com.youlai.boot.common.annotation.OperLog;
import com.youlai.boot.system.model.entity.TDevice;
import com.youlai.boot.system.model.form.IdsForm;
import com.youlai.boot.system.model.vo.TBuildingTreeVO;
import com.youlai.boot.system.model.vo.TPrisonTreeVO;
import com.youlai.boot.system.model.vo.TProvinceTreeVO;
import com.youlai.boot.system.service.TDeviceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.youlai.boot.system.model.form.TDeviceForm;
import com.youlai.boot.system.model.query.TDeviceQuery;
import com.youlai.boot.system.model.vo.TDeviceVO;
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
 * 设备前端控制层
 *
 * @author youlaitech
 * @since 2026-01-20 20:17
 */
@Tag(name = "16.设备接口")
@RestController
@RequestMapping("/api/v1/device")
@RequiredArgsConstructor
public class TDeviceController  {

    private final TDeviceService tDeviceService;

    @Operation(summary = "设备分页列表")
    @GetMapping("/page")
//    @PreAuthorize("@ss.hasPerm('system:device:query')")
    public PageResult<TDeviceVO> getTDevicePage(TDeviceQuery queryParams ) {
        IPage<TDeviceVO> result = tDeviceService.getTDevicePage(queryParams);
        return PageResult.success(result);
    }

    @Operation(summary = "新增设备")
    @PostMapping
    @OperLog(value="新增设备")
//    @PreAuthorize("@ss.hasPerm('system:device:add')")
    public Result<Void> saveTDevice(@RequestBody @Valid TDeviceForm formData ) {
        boolean result = tDeviceService.saveTDevice(formData);
        return Result.judge(result);
    }

    @Operation(summary = "获取设备表单数据")
    @GetMapping("/{id}/form")
//    @PreAuthorize("@ss.hasPerm('system:device:edit')")
    public Result<TDeviceForm> getTDeviceForm(
        @Parameter(description = "设备ID") @PathVariable Long id
    ) {
        TDeviceForm formData = tDeviceService.getTDeviceFormData(id);
        return Result.success(formData);
    }

    @Operation(summary = "修改设备")
    @PutMapping(value = "/{id}")
    @OperLog(value="修改设备")
//    @PreAuthorize("@ss.hasPerm('system:device:edit')")
    public Result<Void> updateTDevice(
            @Parameter(description = "设备ID") @PathVariable Long id,
            @RequestBody @Validated TDeviceForm formData
    ) {
        boolean result = tDeviceService.updateTDevice(id, formData);
        return Result.judge(result);
    }
    @Operation(summary = "修改设备CH1-CH8")
    @PutMapping(value = "/{deviceId}/channels")
    @OperLog(value="修改设备CH")
//    @PreAuthorize("@ss.hasPerm('system:device:edit')")
    public Result<Void> updateCH(
            @Parameter(description = "设备ID") @PathVariable Long deviceId,
            @RequestBody @Validated JSONObject jsonObject
    ) {
        boolean result = tDeviceService.updateCH(deviceId, jsonObject);
        return Result.judge(result);
    }

    @Operation(summary = "删除设备")
    @DeleteMapping("/{ids}")
    @OperLog(value="删除设备")
//    @PreAuthorize("@ss.hasPerm('system:device:delete')")
    public Result<Void> deleteTDevices(
        @Parameter(description = "设备ID，多个以英文逗号(,)分割") @PathVariable String ids
    ) {
        boolean result = tDeviceService.deleteTDevices(ids);
        return Result.judge(result);
    }

    @Operation(summary = "设备列表-全国组织树")
    @GetMapping("/tree/nation")
//    @PreAuthorize("@ss.hasPerm('system:device:query')")
    public Result<List<TProvinceTreeVO>> getTDeviceNationTree(TDeviceQuery queryParams ) {
        List<TProvinceTreeVO> result = tDeviceService.getTDeviceNationTree(queryParams);
        return Result.success(result);
    }

    @Operation(summary = "设备列表-全国")
    @GetMapping("/page/nation")
//    @PreAuthorize("@ss.hasPerm('system:device:query')")
    public Result<List<TProvinceTreeVO>> getTDeviceNation(TDeviceQuery queryParams ) {
        List<TProvinceTreeVO> result = tDeviceService.getTDeviceNation(queryParams);
        return Result.success(result);
    }
    @Operation(summary = "设备列表-省")
    @GetMapping("/page/province")
//    @PreAuthorize("@ss.hasPerm('system:device:query')")
    public Result<TProvinceTreeVO> getTDeviceProvince(Long provinceId, TDeviceQuery queryParams ) {
        TProvinceTreeVO data = tDeviceService.getTDeviceProvince(provinceId, queryParams);
        return Result.success(data);
    }
    @Operation(summary = "设备列表-监狱")
    @GetMapping("/page/prison")
//    @PreAuthorize("@ss.hasPerm('system:device:query')")
    public Result<TPrisonTreeVO> getTDevicePrison(Long prisonId, TDeviceQuery queryParams ) {
        TPrisonTreeVO data = tDeviceService.getTDevicePrison(prisonId, queryParams);
        return Result.success(data);
    }

    @Operation(summary = "设备列表-楼")
    @GetMapping("/page/building")
//    @PreAuthorize("@ss.hasPerm('system:device:query')")
    public Result<TBuildingTreeVO> getTDeviceBuilding(Long buildingId, TDeviceQuery queryParams ) {
        TBuildingTreeVO data = tDeviceService.getTDeviceBuilding(buildingId, queryParams);
        return Result.success(data);
    }

    @Operation(summary = "设备列表-楼层")
    @GetMapping("/page/floor")
//    @PreAuthorize("@ss.hasPerm('system:device:query')")
    public Result<List<TDevice>> getTDeviceFloor(Long floorId, TDeviceQuery queryParams ) {
        List<TDevice> data = tDeviceService.getTDeviceFloor(floorId, queryParams);
        return Result.success(data);
    }

    @Operation(summary = "批量开启设备")
    @PostMapping("/enableDevices")
    @OperLog(value = "批量开启设备")
//    @PreAuthorize("@ss.hasPerm('system:device:delete')")
    public Result<Void> enableDevices(
            @RequestBody IdsForm formData
    ) {
        boolean result = tDeviceService.enableDevices(formData);
        return Result.judge(result);
    }
    @Operation(summary = "批量关闭设备")
    @PostMapping("/disableDevices")
    @OperLog(value = "批量关闭设备")
//    @PreAuthorize("@ss.hasPerm('system:device:delete')")
    public Result<Void> disableDevices(
            @RequestBody IdsForm formData
    ) {
        boolean result = tDeviceService.disableDevices(formData);
        return Result.judge(result);
    }


    @Operation(summary = "修改设备坐标")
    @PutMapping(value = "/updateTDeviceXY/{id}")
    @OperLog(value = "修改设备坐标")
//    @PreAuthorize("@ss.hasPerm('system:floor:edit')")
    public Result<Void> updateTDeviceXY(
            @Parameter(description = "楼层ID") @PathVariable Long id,
            @Parameter(description = "X轴") @RequestParam String positionX,
            @Parameter(description = "Y轴") @RequestParam String positionY
    ) {
        boolean result = tDeviceService.updateTDeviceXY(id, positionX, positionY);
        return Result.judge(result);
    }
}

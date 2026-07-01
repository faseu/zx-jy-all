package com.youlai.boot.system.controller;

import com.youlai.boot.common.annotation.Log;
import com.youlai.boot.common.annotation.OperLog;
import com.youlai.boot.common.enums.LogModuleEnum;
import com.youlai.boot.core.web.Result;
import com.youlai.boot.system.model.vo.ProvinceDetailVO;
import com.youlai.boot.system.model.vo.ProvinceVO;
import com.youlai.boot.system.model.vo.TPrisonDetailVO;
import com.youlai.boot.system.service.ProvinceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 组织控制器
 *
 * @author Ray.Hao
 * @since 2020/11/6
 */
@Tag(name = "12.省份接口")
@RestController
@RequestMapping("/api/v1/province")
@RequiredArgsConstructor
public class ProvinceController {

    private final ProvinceService provinceService;

    @Operation(summary = "省份列表统计")
    @GetMapping
    @Log( value = "省份列表统计",module = LogModuleEnum.DEPT)
    public Result<List<ProvinceVO>> getProvinceList(
    ) {
        List<ProvinceVO> list = provinceService.getProvinceList();
        return Result.success(list);
    }

    @Operation(summary = "省份详情统计")
    @OperLog(value="点击省份详情统计")
    @GetMapping("/{provinceId}")
    public Result<ProvinceDetailVO> getProvinceInfo(
            @Parameter(description ="省份ID") @PathVariable Long provinceId
    ) {
        ProvinceDetailVO info = provinceService.getProvinceInfo(provinceId);
        return Result.success(info);
    }

    @Operation(summary = "省份详情监狱列表")
    @OperLog(value="查看省份监狱列表")
    @GetMapping("/prisons/{provinceId}")
    public Result<List<TPrisonDetailVO>> getPrisons(
            @Parameter(description ="省份ID") @PathVariable Long provinceId
    ) {
        List<TPrisonDetailVO> info = provinceService.getPrisonList(provinceId);
        return Result.success(info);
    }

}

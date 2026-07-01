package com.youlai.boot.system.converter;

import org.mapstruct.Mapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.youlai.boot.system.model.entity.TBuilding;
import com.youlai.boot.system.model.form.TBuildingForm;

/**
 * 楼栋对象转换器
 *
 * @author youlaitech
 * @since 2026-01-20 20:15
 */
@Mapper(componentModel = "spring")
public interface TBuildingConverter{

    TBuildingForm toForm(TBuilding entity);

    TBuilding toEntity(TBuildingForm formData);
}
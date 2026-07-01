package com.youlai.boot.system.converter;

import org.mapstruct.Mapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.youlai.boot.system.model.entity.TFloor;
import com.youlai.boot.system.model.form.TFloorForm;

/**
 * 楼层对象转换器
 *
 * @author youlaitech
 * @since 2026-01-20 20:15
 */
@Mapper(componentModel = "spring")
public interface TFloorConverter{

    TFloorForm toForm(TFloor entity);

    TFloor toEntity(TFloorForm formData);
}
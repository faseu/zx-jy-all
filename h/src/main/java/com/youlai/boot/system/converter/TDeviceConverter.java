package com.youlai.boot.system.converter;

import org.mapstruct.Mapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.youlai.boot.system.model.entity.TDevice;
import com.youlai.boot.system.model.form.TDeviceForm;

/**
 * 设备对象转换器
 *
 * @author youlaitech
 * @since 2026-01-20 20:17
 */
@Mapper(componentModel = "spring")
public interface TDeviceConverter{

    TDeviceForm toForm(TDevice entity);

    TDevice toEntity(TDeviceForm formData);
}
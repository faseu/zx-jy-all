package com.youlai.boot.system.service;

import com.alibaba.fastjson.JSONObject;
import com.youlai.boot.system.model.entity.TDevice;
import com.youlai.boot.system.model.form.IdsForm;
import com.youlai.boot.system.model.form.TDeviceForm;
import com.youlai.boot.system.model.query.TDeviceQuery;
import com.youlai.boot.system.model.vo.*;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;
import java.util.Optional;

/**
 * 设备服务类
 *
 * @author youlaitech
 * @since 2026-01-20 20:17
 */
public interface TDeviceService extends IService<TDevice> {

    /**
     *设备分页列表
     *
     * @return {@link IPage<TDeviceVO>} 设备分页列表
     */
    IPage<TDeviceVO> getTDevicePage(TDeviceQuery queryParams);

    /**
     * 获取设备表单数据
     *
     * @param id 设备ID
     * @return 设备表单数据
     */
     TDeviceForm getTDeviceFormData(Long id);

    /**
     * 新增设备
     *
     * @param formData 设备表单对象
     * @return 是否新增成功
     */
    boolean saveTDevice(TDeviceForm formData);

    /**
     * 修改设备
     *
     * @param id   设备ID
     * @param formData 设备表单对象
     * @return 是否修改成功
     */
    boolean updateTDevice(Long id, TDeviceForm formData);

    boolean updateCH(Long id, JSONObject jsonObject);

    /**
     * 删除设备
     *
     * @param ids 设备ID，多个以英文逗号(,)分割
     * @return 是否删除成功
     */
    boolean deleteTDevices(String ids);

    /**
     * 批量启用设备
     * @param formData
     * @return
     */
    boolean enableDevices(IdsForm formData);

    /**
     * 批量禁用设备
     * @param formData
     * @return
     */
    boolean disableDevices(IdsForm formData);

    /**
     * 设备列表-全国
     * @param queryParams
     * @return
     */
    List<TProvinceTreeVO> getTDeviceNation(TDeviceQuery queryParams);
    List<TProvinceTreeVO> getTDeviceNationTree(TDeviceQuery queryParams);
    /**
     * 设备列表-省
     * @param queryParams
     * @return
     */
    TProvinceTreeVO getTDeviceProvince(Long provinceId, TDeviceQuery queryParams);

    /**
     * 设备列表-监狱
     * @param queryParams
     * @return
     */
    TPrisonTreeVO getTDevicePrison(Long prisonId, TDeviceQuery queryParams);

    TBuildingTreeVO getTDeviceBuilding(Long building, TDeviceQuery queryParams);

    /**
     * 设备列表-楼层
     * @param queryParams
     * @return
     */
    List<TDevice> getTDeviceFloor(Long floorId, TDeviceQuery queryParams);

    boolean updateTDeviceXY(Long id, String positionX, String positionY);

    /**
     * 根据设备编号查询设备记录（返回Optional，更安全的用法）
     * @param entireNo 设备编号
     * @return Optional包装的设备实体对象
     */
    Optional<TDevice> getTDeviceByEntireNoOptional(String entireNo);
}

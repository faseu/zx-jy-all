package com.youlai.boot.system.service;

import com.youlai.boot.system.model.entity.TFloor;
import com.youlai.boot.system.model.form.TFloorForm;
import com.youlai.boot.system.model.query.TFloorQuery;
import com.youlai.boot.system.model.vo.TFloorVO;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;

/**
 * 楼层服务类
 *
 * @author youlaitech
 * @since 2026-01-20 20:15
 */
public interface TFloorService extends IService<TFloor> {

    /**
     *楼层分页列表
     *
     * @return {@link IPage<TFloorVO>} 楼层分页列表
     */
    IPage<TFloorVO> getTFloorPage(TFloorQuery queryParams);

    /**
     * 获取楼层表单数据
     *
     * @param id 楼层ID
     * @return 楼层表单数据
     */
     TFloorForm getTFloorFormData(Long id);

    /**
     * 新增楼层
     *
     * @param formData 楼层表单对象
     * @return 是否新增成功
     */
    boolean saveTFloor(TFloorForm formData);

    /**
     * 修改楼层
     *
     * @param id   楼层ID
     * @param formData 楼层表单对象
     * @return 是否修改成功
     */
    boolean updateTFloor(Long id, TFloorForm formData);
    /**
     * 删除楼层
     *
     * @param ids 楼层ID，多个以英文逗号(,)分割
     * @return 是否删除成功
     */
    boolean deleteTFloors(String ids);

    /**
     * 修改楼层
     *
     * @param id   楼层ID
     * @return 是否修改成功
     */
    boolean updateTFloorDraw(Long id, String filePath);
}

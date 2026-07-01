package com.youlai.boot.system.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.youlai.boot.system.model.entity.TPrison;
import com.youlai.boot.system.model.form.TPrisonForm;
import com.youlai.boot.system.model.query.TPrisonQuery;
import com.youlai.boot.system.model.vo.TBuildingDetailVO;
import com.youlai.boot.system.model.vo.TPrisonInfoVO;
import com.youlai.boot.system.model.vo.TPrisonVO;

import java.util.List;

/**
 * 监狱服务类
 *
 * @author youlaitech
 * @since 2026-01-20 20:12
 */
public interface TPrisonService extends IService<TPrison> {

    /**
     *监狱分页列表
     *
     * @return {@link IPage<TPrisonVO>} 监狱分页列表
     */
    IPage<TPrisonVO> getTPrisonPage(TPrisonQuery queryParams);

    /**
     * 获取监狱表单数据
     *
     * @param id 监狱ID
     * @return 监狱表单数据
     */
     TPrisonForm getTPrisonFormData(Long id);

    /**
     * 新增监狱
     *
     * @param formData 监狱表单对象
     * @return 是否新增成功
     */
    boolean saveTPrison(TPrisonForm formData);

    /**
     * 修改监狱
     *
     * @param id   监狱ID
     * @param formData 监狱表单对象
     * @return 是否修改成功
     */
    boolean updateTPrison(Long id, TPrisonForm formData);

    /**
     * 删除监狱
     *
     * @param ids 监狱ID，多个以英文逗号(,)分割
     * @return 是否删除成功
     */
    boolean deleteTPrisons(String ids);

    TPrisonInfoVO getTPrisonInfo(Long prisonId);

    List<TBuildingDetailVO> getBuildingList(Long prisonId);

}

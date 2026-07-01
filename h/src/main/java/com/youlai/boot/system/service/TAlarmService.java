package com.youlai.boot.system.service;

import com.youlai.boot.system.model.dto.AlarmExportDTO;
import com.youlai.boot.system.model.dto.UserExportDTO;
import com.youlai.boot.system.model.entity.TAlarm;
import com.youlai.boot.system.model.form.TAlarmForm;
import com.youlai.boot.system.model.query.TAlarmQuery;
import com.youlai.boot.system.model.query.UserPageQuery;
import com.youlai.boot.system.model.vo.TAlarmVO;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

/**
 * 告警服务类
 *
 * @author youlaitech
 * @since 2026-01-20 20:18
 */
public interface TAlarmService extends IService<TAlarm> {

    /**
     *告警分页列表
     *
     * @return {@link IPage<TAlarmVO>} 告警分页列表
     */
    IPage<TAlarmVO> getTAlarmPage(TAlarmQuery queryParams);

    /**
     * 获取告警表单数据
     *
     * @param id 告警ID
     * @return 告警表单数据
     */
     TAlarmForm getTAlarmFormData(Long id);

    /**
     * 新增告警
     *
     * @param formData 告警表单对象
     * @return 是否新增成功
     */
    boolean saveTAlarm(TAlarmForm formData);

    /**
     * 修改告警
     *
     * @param id   告警ID
     * @param formData 告警表单对象
     * @return 是否修改成功
     */
    boolean updateTAlarm(Long id, TAlarmForm formData);

    /**
     * 删除告警
     *
     * @param ids 告警ID，多个以英文逗号(,)分割
     * @return 是否删除成功
     */
    boolean deleteTAlarms(String ids);


    /**
     * 获取导出告警列表
     *
     * @param queryParams 查询参数
     * @return {@link List < UserExportDTO >} 导出用户列表
     */
    List<AlarmExportDTO> listExportAlarms(TAlarmQuery queryParams);

}

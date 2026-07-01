package com.youlai.boot.system.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.youlai.boot.system.model.entity.TOperLog;
import com.youlai.boot.system.model.form.ClientOperLogForm;
import com.youlai.boot.system.model.query.OperLogPageQuery;
import com.youlai.boot.system.model.vo.OperLogPageVO;

/**
 * 系统日志 服务接口
 *
 * @author Ray.Hao
 * @since 2.10.0
 */
public interface TOperLogService extends IService<TOperLog> {

    /**
     * 获取日志分页列表
     */
    Page<OperLogPageVO> getLogPage(OperLogPageQuery queryParams);

    boolean saveClientLog(ClientOperLogForm formData);

}

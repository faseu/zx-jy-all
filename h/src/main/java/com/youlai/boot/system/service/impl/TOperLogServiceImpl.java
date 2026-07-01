package com.youlai.boot.system.service.impl;

import com.alibaba.fastjson.JSON;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.youlai.boot.security.util.SecurityUtils;
import com.youlai.boot.system.mapper.TOperLogMapper;
import com.youlai.boot.system.model.entity.TOperLog;
import com.youlai.boot.system.mapper.UserMapper;
import com.youlai.boot.system.model.entity.User;
import com.youlai.boot.system.model.form.ClientOperLogForm;
import com.youlai.boot.system.model.query.OperLogPageQuery;
import com.youlai.boot.system.model.vo.OperLogPageVO;
import com.youlai.boot.system.service.TOperLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;

/**
 * 系统日志 服务实现类
 *
 * @author Ray.Hao
 * @since 2.10.0
 */
@Service
@RequiredArgsConstructor
public class TOperLogServiceImpl extends ServiceImpl<TOperLogMapper, TOperLog>
        implements TOperLogService {

    private final UserMapper userMapper;

    /**
     * 获取日志分页列表
     *
     * @param queryParams 查询参数
     * @return 日志分页列表
     */
    @Override
    public Page<OperLogPageVO> getLogPage(OperLogPageQuery queryParams) {
        return this.baseMapper.getLogPage(new Page<>(queryParams.getPageNum(), queryParams.getPageSize()),
                queryParams);
    }

    @Override
    public boolean saveClientLog(ClientOperLogForm formData) {
        Long userId = SecurityUtils.getUserId();
        String username = SecurityUtils.getUsername();
        User user = userId == null ? null : userMapper.selectById(userId);
        Date now = new Date();

        TOperLog log = new TOperLog();
        log.setCreateBy(username);
        log.setLoginTime(user == null || user.getLoginTime() == null ? now : user.getLoginTime());
        log.setOperateTime(now);
        log.setCreateTime(now);
        log.setIsDeleted(0);
        log.setContent(formData.getContent());
        log.setActionCode(formData.getActionCode());
        log.setModuleCode(formData.getModuleCode());
        log.setTargetType(formData.getTargetType());
        log.setTargetId(formData.getTargetId());
        log.setTargetName(formData.getTargetName());
        log.setProvinceId(formData.getProvinceId());
        log.setPrisonId(formData.getPrisonId());
        log.setPrisonLevel(formData.getPrisonLevel());
        log.setPath(formData.getPath());
        log.setRequestMethod("CLIENT");
        log.setParams(JSON.toJSONString(formData));

        return this.save(log);
    }

}



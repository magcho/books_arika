import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

describe('VRT Artifacts Handling', () => {
  it('should have artifact download step in workflow', () => {
    const workflowPath = join(process.cwd(), '..', '.github', 'workflows', 'vrt.yml');
    const content = readFileSync(workflowPath, 'utf-8');
    const workflow = parse(content);
    
    const steps = workflow.jobs.vrt.steps;
    const downloadStep = steps.find((step: any) => 
      step['Download baseline from artifacts (if exists)'] || 
      step.uses?.includes('download-artifact')
    );
    
    expect(downloadStep).toBeDefined();
  });

  it('should have artifact upload step for baseline in workflow', () => {
    const workflowPath = join(process.cwd(), '..', '.github', 'workflows', 'vrt.yml');
    const content = readFileSync(workflowPath, 'utf-8');
    const workflow = parse(content);
    
    const steps = workflow.jobs.vrt.steps;
    const uploadStep = steps.find((step: any) => 
      step['Upload baseline to artifacts'] || 
      (step.uses?.includes('upload-artifact') && step.with?.name === 'vrt-baseline')
    );
    
    expect(uploadStep).toBeDefined();
  });

  it('should have artifact upload step for VRT results in workflow', () => {
    const workflowPath = join(process.cwd(), '..', '.github', 'workflows', 'vrt.yml');
    const content = readFileSync(workflowPath, 'utf-8');
    const workflow = parse(content);
    
    const steps = workflow.jobs.vrt.steps;
    const uploadStep = steps.find((step: any) => 
      step['Upload VRT results to artifacts'] || 
      (step.uses?.includes('upload-artifact') && step.with?.name === 'vrt-results')
    );
    
    expect(uploadStep).toBeDefined();
  });

  it('should configure artifact retention days', () => {
    const workflowPath = join(process.cwd(), '..', '.github', 'workflows', 'vrt.yml');
    const content = readFileSync(workflowPath, 'utf-8');
    
    // 保持期間が設定されているか確認
    expect(content).toContain('retention-days');
  });
});


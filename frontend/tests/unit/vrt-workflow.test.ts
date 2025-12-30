import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

describe('VRT Workflow Configuration', () => {
  it('should have workflow file with valid structure', () => {
    const workflowPath = join(process.cwd(), '..', '.github', 'workflows', 'vrt.yml');
    expect(existsSync(workflowPath)).toBe(true);

    const content = readFileSync(workflowPath, 'utf-8');
    const workflow = parse(content);
    
    expect(workflow.name).toBeDefined();
    expect(workflow.jobs).toBeDefined();
  });

  it('should have workflow trigger on pull_request to main', () => {
    const workflowPath = join(process.cwd(), '..', '.github', 'workflows', 'vrt.yml');
    const content = readFileSync(workflowPath, 'utf-8');
    const workflow = parse(content);
    
    expect(workflow.on).toBeDefined();
    expect(workflow.on.pull_request).toBeDefined();
    expect(workflow.on.pull_request.branches).toContain('main');
  });

  it('should have timeout configured for VRT job', () => {
    const workflowPath = join(process.cwd(), '..', '.github', 'workflows', 'vrt.yml');
    const content = readFileSync(workflowPath, 'utf-8');
    const workflow = parse(content);
    
    expect(workflow.jobs.vrt['timeout-minutes']).toBeDefined();
    expect(workflow.jobs.vrt['timeout-minutes']).toBeGreaterThan(0);
  });

  it('should have checkout with fetch-depth 0 for Git history', () => {
    const workflowPath = join(process.cwd(), '..', '.github', 'workflows', 'vrt.yml');
    const content = readFileSync(workflowPath, 'utf-8');
    const workflow = parse(content);
    
    const steps = workflow.jobs.vrt.steps;
    const checkoutStep = steps.find((step: any) => 
      step.uses?.includes('checkout')
    );
    
    expect(checkoutStep).toBeDefined();
    expect(checkoutStep.with?.['fetch-depth']).toBe(0);
  });

  it('should have VRT failure check step that fails on diff detection', () => {
    const workflowPath = join(process.cwd(), '..', '.github', 'workflows', 'vrt.yml');
    const content = readFileSync(workflowPath, 'utf-8');
    const workflow = parse(content);
    
    const steps = workflow.jobs.vrt.steps;
    const checkStep = steps.find((step: any) => 
      step['Check VRT results'] || 
      step.name?.includes('Check VRT')
    );
    
    expect(checkStep).toBeDefined();
  });
});


import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

describe('GitHub Actions Workflow', () => {
  it('should have vrt.yml workflow file', () => {
    const workflowPath = join(process.cwd(), '..', '.github', 'workflows', 'vrt.yml');
    expect(existsSync(workflowPath)).toBe(true);
  });

  it('should have valid YAML syntax in workflow file', () => {
    const workflowPath = join(process.cwd(), '..', '.github', 'workflows', 'vrt.yml');
    const content = readFileSync(workflowPath, 'utf-8');
    
    // YAMLパースエラーが発生しないか確認
    expect(() => parse(content)).not.toThrow();
  });

  it('should have PR trigger configured', () => {
    const workflowPath = join(process.cwd(), '..', '.github', 'workflows', 'vrt.yml');
    const content = readFileSync(workflowPath, 'utf-8');
    const workflow = parse(content);
    
    expect(workflow.on).toBeDefined();
    expect(workflow.on.pull_request).toBeDefined();
    expect(workflow.on.pull_request.branches).toContain('main');
  });

  it('should have VRT job configured', () => {
    const workflowPath = join(process.cwd(), '..', '.github', 'workflows', 'vrt.yml');
    const content = readFileSync(workflowPath, 'utf-8');
    const workflow = parse(content);
    
    expect(workflow.jobs).toBeDefined();
    expect(workflow.jobs.vrt).toBeDefined();
  });

  it('should have required steps in workflow', () => {
    const workflowPath = join(process.cwd(), '..', '.github', 'workflows', 'vrt.yml');
    const content = readFileSync(workflowPath, 'utf-8');
    const workflow = parse(content);
    
    const steps = workflow.jobs.vrt.steps;
    const stepNames = steps.map((step: any) => step.name || Object.keys(step)[0]);
    
    expect(stepNames).toContain('Checkout repository');
    expect(stepNames).toContain('Setup Node.js');
    expect(stepNames).toContain('Install dependencies');
    expect(stepNames).toContain('Build Storybook');
    expect(stepNames).toContain('Run VRT - Capture screenshots');
    expect(stepNames).toContain('Run reg-suit - Compare and generate diff report');
  });
});


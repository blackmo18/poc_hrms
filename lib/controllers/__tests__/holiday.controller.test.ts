import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HolidayController } from '../holiday.controller';
import { prisma } from '../../db';
import { HolidayType } from '@prisma/client';

// Mock Prisma
vi.mock('../../db', () => ({
  prisma: {
    holidayTemplate: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    holiday: {
      findMany: vi.fn(),
      update: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

// Create mock data factory functions
const createMockHolidayTemplate = (overrides: any = {}) => ({
  id: 'template-123',
  organizationId: 'org-123',
  name: 'Test Template',
  description: 'Test Description',
  isDefault: false,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

const createMockHoliday = (overrides: any = {}) => ({
  id: 'holiday-123',
  organizationId: 'org-123',
  name: 'Test Holiday',
  date: new Date('2026-01-01'),
  type: HolidayType.REGULAR,
  rateMultiplier: 1.0,
  isPaidIfNotWorked: true,
  countsTowardOt: false,
  holidayTemplateId: 'template-123',
  isRecurring: false,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

describe('HolidayController', () => {
  let holidayController: HolidayController;

  beforeEach(() => {
    holidayController = new HolidayController();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createHolidayTemplate', () => {
    it('should create template with holidays using UTC midnight dates', async () => {
      // Arrange
      const organizationId = 'org-123';
      const name = 'Test Template';
      const description = 'Test Description';
      const holidays = [
        {
          name: 'New Year',
          date: '2026-01-01',
          type: 'REGULAR',
          rateMultiplier: 1.0,
          isPaidIfNotWorked: true,
          countsTowardOt: false,
        },
        {
          name: 'Test Holiday',
          date: '2026-02-15',
          type: 'SPECIAL_NON_WORKING',
          rateMultiplier: 1.3,
          isPaidIfNotWorked: false,
          countsTowardOt: true,
        },
      ];

      const mockCreatedTemplate = createMockHolidayTemplate({
        id: 'template-123',
        organizationId,
        name,
        description,
        holidays: [
          createMockHoliday({
            id: 'holiday-1',
            date: new Date(Date.UTC(2026, 0, 1)), // Jan 1, 2026 00:00:00 UTC
            name: 'New Year',
            type: HolidayType.REGULAR,
            rateMultiplier: 1.0,
            isPaidIfNotWorked: true,
            countsTowardOt: false,
          }),
          createMockHoliday({
            id: 'holiday-2',
            date: new Date(Date.UTC(2026, 1, 15)), // Feb 15, 2026 00:00:00 UTC
            name: 'Test Holiday',
            type: HolidayType.SPECIAL_NON_WORKING,
            rateMultiplier: 1.3,
            isPaidIfNotWorked: false,
            countsTowardOt: true,
          }),
        ],
      });

      vi.mocked(prisma.holidayTemplate.create).mockResolvedValue(mockCreatedTemplate);

      // Act
      const result = await holidayController.createHolidayTemplate(
        organizationId,
        name,
        description,
        undefined,
        holidays
      );

      // Assert
      expect(prisma.holidayTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId,
          name,
          description,
          holidays: {
            create: expect.arrayContaining([
              expect.objectContaining({
                date: new Date(Date.UTC(2026, 0, 1)), // Should be midnight UTC
                name: 'New Year',
                type: HolidayType.REGULAR,
              }),
              expect.objectContaining({
                date: new Date(Date.UTC(2026, 1, 15)), // Should be midnight UTC
                name: 'Test Holiday',
                type: HolidayType.SPECIAL_NON_WORKING,
              }),
            ]),
          },
        }),
        include: { holidays: true },
      });

      expect(result).toEqual(mockCreatedTemplate);
    });

    it('should create template without holidays', async () => {
      // Arrange
      const mockCreatedTemplate = createMockHolidayTemplate({
        id: 'template-123',
        organizationId: 'org-123',
        name: 'Empty Template',
        description: 'No holidays',
      });

      vi.mocked(prisma.holidayTemplate.create).mockResolvedValue(mockCreatedTemplate);

      // Act
      const result = await holidayController.createHolidayTemplate(
        'org-123',
        'Empty Template',
        'No holidays'
      );

      // Assert
      expect(prisma.holidayTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-123',
          name: 'Empty Template',
          description: 'No holidays',
        }),
        include: { holidays: true },
      });

      expect(result).toEqual(mockCreatedTemplate);
    });
  });

  describe('updateHolidayTemplate', () => {
    it('should perform smart update: update existing, create new, delete removed', async () => {
      // Arrange
      const templateId = 'template-123';
      const updateData = {
        name: 'Updated Template',
        description: 'Updated Description',
        holidays: [
          // Existing holiday to update
          {
            id: 'holiday-1',
            name: 'Updated Holiday',
            date: '2026-01-01',
            type: 'REGULAR',
            rateMultiplier: 2.0,
            isPaidIfNotWorked: true,
            countsTowardOt: false,
          },
          // New holiday to create
          {
            name: 'New Holiday',
            date: '2026-02-14',
            type: 'SPECIAL_NON_WORKING',
            rateMultiplier: 1.3,
            isPaidIfNotWorked: false,
            countsTowardOt: true,
          },
        ],
      };

      const existingTemplate = createMockHolidayTemplate({
        id: templateId,
        name: 'Old Template',
        organizationId: 'org-123',
      });

      const existingHolidays = [
        createMockHoliday({
          id: 'holiday-1',
          name: 'Old Holiday',
          date: new Date('2026-01-01'),
          type: HolidayType.REGULAR,
        }),
        createMockHoliday({
          id: 'holiday-2', // This one should be deleted
          name: 'To Delete',
          date: new Date('2026-03-15'),
          type: HolidayType.SPECIAL_NON_WORKING,
        }),
      ];

      vi.mocked(prisma.holidayTemplate.findUnique).mockResolvedValue(existingTemplate);
      vi.mocked(prisma.holiday.findMany).mockResolvedValue(existingHolidays);
      vi.mocked(prisma.holidayTemplate.update).mockResolvedValue(existingTemplate);
      vi.mocked(prisma.holiday.update).mockResolvedValue(createMockHoliday());
      vi.mocked(prisma.holiday.deleteMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.holiday.createMany).mockResolvedValue({ count: 1 });

      // Act
      const result = await holidayController.updateHolidayTemplate(templateId, updateData);

      // Assert
      expect(prisma.holiday.update).toHaveBeenCalledWith({
        where: { id: 'holiday-1' },
        data: expect.objectContaining({
          name: 'Updated Holiday',
          date: new Date(Date.UTC(2026, 0, 1)), // Should be midnight UTC
          rateMultiplier: 2.0,
        }),
      });

      expect(prisma.holiday.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['holiday-2'] }, // Should delete the removed holiday
        },
      });

      expect(prisma.holiday.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            name: 'New Holiday',
            date: new Date(Date.UTC(2026, 1, 14)), // Should be midnight UTC
            type: HolidayType.SPECIAL_NON_WORKING,
          }),
        ]),
      });

      expect(result).toEqual(existingTemplate);
    });
  });

  describe('deleteHolidayTemplate', () => {
    it('should delete template and cascade delete holidays', async () => {
      // Arrange
      const templateId = 'template-123';
      const mockTemplate = createMockHolidayTemplate({
        id: templateId,
        name: 'Test Template',
        isDefault: false,
      });

      vi.mocked(prisma.holidayTemplate.findUnique).mockResolvedValue(mockTemplate);
      vi.mocked(prisma.holidayTemplate.delete).mockResolvedValue(mockTemplate);

      // Act
      await holidayController.deleteHolidayTemplate(templateId);

      // Assert
      expect(prisma.holidayTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: templateId },
      });

      expect(prisma.holidayTemplate.delete).toHaveBeenCalledWith({
        where: { id: templateId },
      });
    });

    it('should throw error when template not found', async () => {
      // Arrange
      const templateId = 'non-existent';
      vi.mocked(prisma.holidayTemplate.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(holidayController.deleteHolidayTemplate(templateId)).rejects.toThrow(
        'Holiday template not found'
      );
    });

    it('should throw error when trying to delete default template', async () => {
      // Arrange
      const templateId = 'default-template';
      const mockTemplate = createMockHolidayTemplate({
        id: templateId,
        name: 'Default Template',
        isDefault: true,
      });

      vi.mocked(prisma.holidayTemplate.findUnique).mockResolvedValue(mockTemplate);

      // Act & Assert
      await expect(holidayController.deleteHolidayTemplate(templateId)).rejects.toThrow(
        'Cannot delete system default templates'
      );
    });
  });
});
